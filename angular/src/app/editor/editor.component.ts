import {Component, ElementRef, inject, OnDestroy, OnInit, TemplateRef, viewChild, ViewChild} from '@angular/core';
import {ResizeEvent} from 'angular-resizable-element';
import {MatButtonToggleChange} from "@angular/material/button-toggle";
import {DbUser, ServerError, SocketioService} from "../socketio/socketio.service";
import {ToolbarService} from "../toolbar/toolbar.service";
import {NgxEditorModel} from "ngx-monaco-editor-v2";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {DialogSetNameComponent} from "../dialog-set-name/dialog-set-name.component";
import {MatDialog} from "@angular/material/dialog";
import {fromEvent, Subscription} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {LoaderService} from "../loader/loader.service";
import {DocumentServiceService} from "./document-service/document-service.service";
import {RemoteCursor} from "@convergencelabs/monaco-collab-ext/typings/RemoteCursor";
import {EditorContentManager, RemoteCursorManager} from "@convergencelabs/monaco-collab-ext";

interface LoadedAssets {
  editorContent: boolean,
  component_init: boolean,
  remote_content_init: boolean,
  ngOnInit: boolean,
  editorOnInit: boolean
}

interface Cursor {
  cursor: RemoteCursor
  color: string,
  offset: number
}

interface ConnectedUser {
  user: DbUser,
  cursor: Cursor
}

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})

export class EditorComponent implements OnInit, OnDestroy {
  monacoEditorOptions = {theme: "vs-dark", language: "markdown"};
  monacoCode: string = "";

  model: NgxEditorModel = {
    value: this.monacoCode,
    language: 'markdown',
    //uri: monaco.Uri.parse('a://b/foo.json')
  };
  remoteCursorManager: RemoteCursorManager;
  updatedHtml = '';
  updatedContent = '';

  // Resizing
  editorViewValue = "splitted";
  scrollAttachValue = "attached";
  active_editor_width = 50;
  passive_editor_width = 50;
  editor_hidden = false;
  updateId = 0;
  clientId = undefined;
  //// Cursor update
  protected connectedUsers = new Map<string, ConnectedUser>;
  doc_uuid: string;


  protected readOnly = false;
  subscriptions: Subscription[] = [];


  loadedAssets: LoadedAssets = {
    editorContent: false,
    editorOnInit: false,
    ngOnInit: false,
    component_init: false,
    remote_content_init: false
  }

  @ViewChild('textareaRef') textareaRef!: ElementRef;
  @ViewChild('themeButton') themeButtonRef!: ElementRef;
  @ViewChild('active_editorRef') active_editorRef!: ElementRef;

  @ViewChild('editor_container') editor_container!: ElementRef;
  @ViewChild('result_displayer') result_displayer!: ElementRef;
  @ViewChild('editor_cursor_container_ref') editor_cursor_container!: ElementRef;
  @ViewChild('imageInput') imageInputElement!: ElementRef;

  @ViewChild('editorSwitcherTemplate', { static: true }) editorSwitcherTemplateRef!: TemplateRef<any>;
  @ViewChild('otherUsersTemplate', { static: true }) otherUsersTemplateRef!: TemplateRef<any>;
  @ViewChild('downloadAsTemplate', { static: true }) downloadAsTemplate!: TemplateRef<any>;
  @ViewChild('documentTitle', { static: true }) documentTitleRef!: TemplateRef<any>;

  readonly dialog = inject(MatDialog);
  protected editorRef: any;   // No Angular detailed type for ICodeEditor https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.ICodeEditor.html
  private previousResultDisplayerScrollTop: number;
  private previousEditorScrollTop: number;

  constructor(protected router: Router, private route: ActivatedRoute,
              private socket: SocketioService, private errorSnackBar: MatSnackBar,
              private toolbarService: ToolbarService, private loadingService: LoaderService,
              protected documentService: DocumentServiceService) {
  }

  getLoadPercent() : number {
    let count = 0;
    let loaded = 0;
    for(let asset in this.loadedAssets) {
      if(this.loadedAssets[asset as keyof LoadedAssets]) {
        loaded += 1
      } else {
        //console.debug(`Waiting for ${asset}`);
      }
      count += 1;
    }

    return loaded/count*100;
  }

  displayError(error: ServerError) {
    console.warn("Received error : ", error.error);
    this.errorSnackBar.open(error.error, "Dismiss", {duration: 2000});
    if(error.requiredAction === "reload") {
      document.location.reload();
    }

  }

  initEditor() {
    this.loadingService.increaseLoading();
    this.socket.emit("init_document_editor");
    this.loadedAssets.component_init = true;
  }

  cursorsTimeOut: any[] = [];
  setMonacoCode(newCode: string) {
    if(this.editorRef === undefined) {
      console.warn("this.editorRef is undefined, retrying in 1sec");
      setTimeout(() => {this.setMonacoCode(newCode)}, 1000);
      return;
    }
    if(this.editorRef.getModel() === undefined) {
      console.warn("this.editorRef.getModel() is undefined, retrying in 1sec");
      setTimeout(() => {this.setMonacoCode(newCode)}, 1000);
      return;
    }
    const bckpSelection = this.editorRef.getSelection();

    this.cursorsTimeOut = [];

    const contentManager = new EditorContentManager({
      editor:this.editorRef,

    });
    contentManager.replace(0, this.monacoCode.length, newCode);
    this.editorRef.setSelection(bckpSelection);
    this.loadedAssets.editorContent = true;
  }

  ngOnInit(): void {
    this.loadingService.resetLoading();
    this.route.params.subscribe((params: Params) => this.doc_uuid = params["doc_uuid"]);
    console.log("DOC UUID : ", this.doc_uuid);
    this.socket.emit("join_room", this.doc_uuid);
    this.loadingService.increaseLoading();
    this.socket.once("join_room", (data: any) => {
      this.loadingService.decreaseLoading();
      if(data !== "OK") {
        this.router.navigate(["/"]);
      } else {
        this.initEditor();
      }

    })
    this.toolbarService.addElement(this.documentTitleRef);
    this.toolbarService.addElement(this.editorSwitcherTemplateRef);
    this.toolbarService.addElement(this.downloadAsTemplate, 'right');
    this.toolbarService.addElement(this.otherUsersTemplateRef, 'right');

    this.socket.once("init_document_editor", (data: any) => {
      for(let required_key of ["document", "update_id", "content", "html", "client_id", "client_cursors"]) {
        if(data[required_key] === undefined) {
          console.error(`Missing required key ${required_key} in init_document_editor`);
        }
      }
      this.loadingService.decreaseLoading();
      this.clientId = data["client_id"];
      console.log(`Received new client ID : ${this.clientId}`);
      for(let client_cursor of data["client_cursors"]) {
        this.updateRemoteCursorPosition(client_cursor["client_id"], client_cursor["cursor_position"]);
      }
      this.updatedContent = data["content"];
      this.setMonacoCode(data["content"]);
      this.updateId = data["update_id"];
      this.documentService.documentInfos = data["document"];
      this.updatedHtml = data["html"];
      this.result_displayer.nativeElement.innerHTML = this.updatedHtml;
      this.updateReadOnly()
      this.loadedAssets.remote_content_init = true;
    });
    /////// End of init events

    this.socket.on("update_document", (data: any) => {
      this.loadingService.decreaseLoading();
      if(!data["document"]) {
        console.error("Error getting document info");
        return;
      }
      for(let required of ["doc_name", "restriction", "owner", "doc_uuid"]) {
        if(data["document"].valueOf(required) == undefined) {
          console.error(`Missing field '${required}' in document info`, data);
          return;
        }
      }
      //this.documentInfos = data["document"];
      this.documentService.documentInfos = data["document"];
      console.debug("Received document infos : ", this.documentService.documentInfos);
      this.updateReadOnly();

    });

    this.socket.on("update", (data: any) => this.remoteContentUpdate(data));

    this.socket.on("client_cursor_update", (data: any) => {
      this.updateRemoteCursorPosition(data["client_id"], data["cursor_position"]);
    })

    this.socket.display_error_observe().subscribe( (data) => {
      this.displayError(data);
    })

    this.subscriptions.push(fromEvent(window, 'scroll')
                           .subscribe(_ => {
                             this.syncScroll(['attached'])
                           }));
    this.subscriptions.push(fromEvent(window, 'keyup') // Manage unmanaged changes (Ctrl+V, return, backspace)
                           .subscribe(_ => {
                             if(this.monacoCode !== this.updatedContent) {
                               this.onChange();
                               this.syncScroll(['semi-attached', 'attached']);
                             } else {
                               this.syncScroll(['semi-attached', 'attached']);
                               this.socket.emit("cursor_update", {"client_id": this.clientId, "cursor_position": this.getCaretPositionInText().foundStart})
                             }
                           }));

    this.socket.connected_user_list_observe().subscribe((connectedUsers) => {
      this.updateConnectedUsersList(connectedUsers)

    })
    this.loadedAssets.ngOnInit = true;
  }

  updateConnectedUsersList(connectedUsers: Map<string, DbUser>) {
    if(this.remoteCursorManager === undefined) {
      setTimeout(()=> {
        console.warn("this.remoteCursorManager undefined, waiting 1 sec");
        this.updateConnectedUsersList(connectedUsers);
      }, 1000);
      return;
    }
    for(let client_id of connectedUsers.keys() ) {
        if(!this.connectedUsers.get(client_id)) {
          let color = this.generateRandomColor();
          this.connectedUsers.set(client_id, {
            user: connectedUsers.get(client_id)!,
            cursor: {
              cursor: this.remoteCursorManager.addCursor(client_id.toString(), color, "|"),
              color: color,
              offset: 0
            }
          })
        }
      }

      for(let client_id of this.connectedUsers.keys()) {
        if(!connectedUsers.get(client_id)) {
          this.connectedUsers.get(client_id)!.cursor.cursor.dispose();
          this.connectedUsers.delete(client_id);
        }
      }
  }

  updateReadOnly() {
    if(this.editorRef === undefined) {
      console.warn("editorRef undefined, waiting 1 sec and retrying updating readonly")
      setTimeout(() => {this.updateReadOnly();}, 1000);
      return;
    }
    this.readOnly = this.documentService.isReadOnly();
    console.log(`Document : `, this.documentService.documentInfos);
    console.log(`READ ONLY position : ${this.readOnly}`)
  }

  editorOnInit(editor: any) {
    this.editorRef = editor;
    this.remoteCursorManager = new RemoteCursorManager({
      editor: this.editorRef,
      tooltips: true,
      tooltipDuration: 200
    })

    if(localStorage.getItem("theme") == "light") {
      editor._themeService.setTheme("vs");
    } else {
      editor._themeService.setTheme("vs-dark");
    }
    document.querySelector("#theme_button")?.addEventListener("click", () => {
      if(localStorage.getItem("theme") === "dark") {
        editor._themeService.setTheme("vs-dark");
      } else {
        editor._themeService.setTheme("vs");
      }
    });
    this.loadedAssets.editorOnInit = true;
  }



  // make sure to destory the editor
  ngOnDestroy(): void {
    this.socket.emit("leave_room", this.doc_uuid);
    document.getElementById("editorSwitcher")!.style.visibility = "hidden";
    this.toolbarService.removeElement(this.editorSwitcherTemplateRef);
    this.toolbarService.removeElement(this.documentTitleRef);
    this.toolbarService.removeElement(this.downloadAsTemplate, 'right');
    this.toolbarService.removeElement(this.otherUsersTemplateRef, 'right');
    for(let subscribtion of this.subscriptions) {
      subscribtion.unsubscribe();
    }
  }



  remoteContentUpdate(data: any) {
    this.updateId = data["update_id"];
    const textarea = document.querySelector("textarea");
    if(!textarea) {
      console.error("Text area not found");
      return;
    }
    this.updatedHtml = data["html"];
    this.result_displayer.nativeElement.innerHTML = this.updatedHtml;

    // Skip editor content update if it is from us
    if(data["client_id"] == this.clientId) {
      return;
    }
    else if(data["update_id"] <= this.updateId) {
      console.debug(`Remote update ID (${data['update_id']}) <= our update ID(${this.updateId})`)
    }
    this.updatedContent = data["content"];
    this.setMonacoCode(this.updatedContent);
    this.updateRemoteCursorPosition(data["client_id"], data["cursor_position"]);
  }
  onChange() {
    if(this.readOnly) {
      // Cancel modifs
      this.displayError({
        error: "Can't edit in readOnly mode",
        level: undefined,
        requiredAction: undefined
      });
      this.monacoCode = this.updatedContent;
      return;
    }
    this.updatedContent = this.monacoCode;
    const {foundStart: cursor_position} = this.getCaretPositionInText();

    this.socket.emit("key", {"content": this.updatedContent, "update_id": this.updateId,
      "client_id": this.clientId, "cursor_position": cursor_position, "doc_uuid": this.doc_uuid});
    this.updateId += 1;
    this.syncScroll(['attached', 'semi-attached']);
  }

  viewSelectorToggled(event: MatButtonToggleChange) {
    this.editorViewValue = event.value;
    if(event.value == "splitted") {
      this.editor_hidden = false;
      this.active_editor_width = 50;
      this.passive_editor_width = 50;
    } else if(event.value == "edit") {
      this.editor_hidden = false;
      this.active_editor_width = 100;
      this.passive_editor_width = 0;
    } else {
      this.editor_hidden = true;
      this.active_editor_width = 0;
      this.passive_editor_width = 100;

    }
    this.resizeEditor();
  }

  onResize(event: ResizeEvent): void {
    if(this.active_editorRef.nativeElement.getBoundingClientRect().width < 500) {
      return;
    }
    if (event.rectangle.width) {
      let percentage: number = event.rectangle.width / this.editor_container.nativeElement.offsetWidth * 100;
      if(percentage > 10 && percentage < 90) {
        this.active_editor_width = percentage;
        this.passive_editor_width = 100 - percentage;
      }
    }
    this.resizeEditor();
  }

  resizeEditor() {
    setTimeout(() => {
      //console.log("View selector toggled");
    const x = this.active_editorRef.nativeElement.getBoundingClientRect().width;
    const y = this.active_editorRef.nativeElement.getBoundingClientRect().height;
    //console.log("Resize to : ", x, y);
      this.editorRef.layout({ width: x-5, height: y });
    }, 500);
  }

  /////////

  updateRemoteCursorPosition(client_id: string, cursor_position: number) {
    if(client_id == this.clientId) {
        return;
    }
    if(this.readOnly) {
      return;
    }
    this.remoteCursorManager.setCursorOffset(client_id.toString(), cursor_position);
  }

  updateLocalCursorPosition(_: any) {
    if(this.readOnly) {
      return;
    }
    const {foundStart: cursorPosition} = this.getCaretPositionInText();
    this.socket.emit("cursor_update", {"client_id": this.clientId, "cursor_position": cursorPosition, "doc_uuid": this.doc_uuid});
    this.syncScroll(['attached']);
  }
  /////////

  generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  syncScroll(required_attach_value: string[]) {
    if(!required_attach_value.includes(this.scrollAttachValue)) {
      return;
    }

    const editorScrollTop = this.editorRef.getScrollTop();
    const rendererScrollTop = this.result_displayer.nativeElement.scrollTop;

    if(this.previousEditorScrollTop != editorScrollTop) {
      //const rendererCountLines = this.result_displayer.nativeElement.innerText.split('\n').length;
      const editorLines = this.monacoCode.split('\n');
      const editorCountLines = editorLines.length;
      const currentLine = this.editorRef.getSelection().startLineNumber;
      const editorPercentage = currentLine/editorCountLines;

      this.result_displayer.nativeElement.scrollTop = this.result_displayer.nativeElement.scrollTopMax * editorPercentage;
    } else if(this.previousResultDisplayerScrollTop != rendererScrollTop) {
      this.editorRef.setScrollTop(rendererScrollTop, 0);
    }
    this.previousEditorScrollTop = this.editorRef.getScrollTop();
    this.previousResultDisplayerScrollTop = this.result_displayer.nativeElement.scrollTop;
    document?.scrollingElement?.scrollIntoView();
  }

  getCaretPositionInText() {
    console.log(this.editorRef)
    const selections = this.editorRef.getSelection();
    const lines = this.monacoCode.split('\n');
    let foundStart = 0;
    let line_i = 0;
    while(line_i < selections.startLineNumber-1) {
      foundStart += lines[line_i].length;
      line_i += 1;
      foundStart += 1; //'\n'
    }
    foundStart += selections.startColumn -1;
    let foundEnd = 0;
    line_i = 0;
    while(line_i < selections.endLineNumber-1) {
      foundEnd += lines[line_i].length;
      line_i += 1;
      foundEnd += 1; //'\n'
    }
    foundEnd += selections.endColumn;
    if(foundStart > foundEnd) {
      const tmp = foundEnd;
      foundEnd = foundStart;
      foundStart = tmp;
    }

    return {
      foundStart,
      foundEnd
    }
  }

  formatToken(event: Event, format_char: string) {
    if(this.readOnly) {
      return;
    }
    let {foundStart, foundEnd} = this.getCaretPositionInText();
    foundStart -= 1;
    foundEnd -= 1;
    this.setMonacoCode(this.monacoCode.substring(0, foundStart) +
        format_char +
        this.monacoCode.substring(foundStart, foundEnd) +
        format_char +
        this.monacoCode.substring(foundEnd));
    this.onChange();
  }

  formatLink(_: Event) {
    if(this.readOnly) {
      return;
    }
    let {foundStart, foundEnd} = this.getCaretPositionInText();

    if(foundStart == foundEnd) {
      this.setMonacoCode(this.monacoCode.substring(0, foundStart) +
          " https://link[Description]" +
          this.monacoCode.substring(foundEnd));
    } else {
      let newLink = `${this.monacoCode.substring(foundStart, foundEnd)}[Description]`;
      if(!newLink.startsWith("https://") && !newLink.startsWith("http://")) {
        newLink = "https://" + newLink;
      }
      if(this.monacoCode.at(foundStart-1) != ' ' && this.monacoCode.at(foundStart-1) != '\n') {
        newLink = ' ' + newLink;
      }
      this.setMonacoCode(this.monacoCode.substring(0, foundStart) +
           newLink +
          this.monacoCode.substring(foundEnd));
    }
    this.onChange();
  }

  formatImageLink(_: Event) {
    if(this.readOnly) {
      return;
    }
    let {foundStart, foundEnd} = this.getCaretPositionInText();
    if(foundStart == foundEnd) {
      this.setMonacoCode(this.monacoCode.substring(0, foundStart) +
          "image::image_link[Image Description]" +
          this.monacoCode.substring(foundEnd));
    } else {
      let newImage = `image::${this.monacoCode.substring(foundStart, foundEnd)}[Image Description]`;
      if(this.monacoCode.at(foundStart-1) != ' ' && this.monacoCode.at(foundStart-1) != '\n') {
        newImage = ' ' + newImage;
      }
      this.setMonacoCode(this.monacoCode.substring(0, foundStart) +
           newImage +
          this.monacoCode.substring(foundEnd));
    }
    this.onChange();
  }

  formatTable(_: Event) {
    if(this.readOnly) {
      return;
    }
    let {foundStart} = this.getCaretPositionInText();
    let newTable = "[cols=\"1,1\"]\n" +
        "|===\n" +
        "|Cell\n" +
        "|Cell\n" +
        "\n" +
        "|Cell\n" +
        "|Cell\n" +
        "|===\n"
    if (this.monacoCode.at(foundStart-1) != ' ' && this.monacoCode.at(foundStart-1) != '\n') {
      newTable = '\n' + newTable;
    }
    this.setMonacoCode(this.monacoCode.substring(0, foundStart) +
        newTable +
        this.monacoCode.substring(foundStart));
  }

  sendImage(_: Event) {
    if(this.readOnly) {
      return;
    }
    this.imageInputElement.nativeElement.click();
  }

  onImageSelected(event: any) {
    if(this.readOnly) {
      return;
    }
    console.log("Selected");
    const file: File = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      this.socket.emit("send_image", {"doc_uuid": this.doc_uuid, "data": base64Image.split(',')[1], "format": file.type});
    };

    reader.readAsDataURL(file);
    this.socket.once("send_image", (data: any) => {
      if(data["image_url"] === undefined) {
        console.warn("Invalid image URL callback received");
        return;
      }
      let { foundStart } = this.getCaretPositionInText();
      while(this.monacoCode.at(foundStart) != '\n' && foundStart < this.monacoCode.length) {
        foundStart += 1;
      }

      this.setMonacoCode(this.monacoCode.substring(0, foundStart) +
           `\n\nimage::${data["image_url"]}[Image Description]` +
          this.monacoCode.substring(foundStart));
      this.onChange();
    })
  }

  /////////////////////////

  setDocumentName() {
    const dialogRef = this.dialog.open(DialogSetNameComponent, {
      width: '250px',
      data: {"doc_name": this.documentService.documentInfos.doc_name}
    });
    dialogRef.afterClosed().subscribe((result) => {
      if(result != undefined) {
        this.documentService.documentInfos.doc_name = result;
        this.loadingService.increaseLoading();
        this.socket.emit("set_document_name", {"document": this.documentService.documentInfos, "doc_uuid": this.doc_uuid});
      }
    })
  }
  download(format: string) {
    this.loadingService.increaseLoading();
    this.socket.once("download_document", (data: any) => {
      this.loadingService.decreaseLoading();
      console.log("Received converted document response");
      let decoded = new Blob([data]);
      let url = window.URL.createObjectURL(decoded);
      let a = document.createElement('a');
      document.body.append('a');
      a.setAttribute('style', 'display: none');
      a.href = url;
      a.download = `${this.documentService.documentInfos.doc_name}.${format}`;
      a.click()
      window.URL.revokeObjectURL(url);
      a.remove();
    });
    this.socket.emit("download_document", {"format": format});

  }
}
