import {Component, ElementRef, inject, OnDestroy, OnInit, TemplateRef, viewChild, ViewChild} from '@angular/core';
import {ResizeEvent} from 'angular-resizable-element';
import {MatButtonToggleChange} from "@angular/material/button-toggle";
import {DbUser, ServerError, SocketioService} from "../socketio/socketio.service";
import {ToolbarService} from "../toolbar/toolbar.service";
import {NgxEditorModel} from "ngx-monaco-editor-v2";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {DialogSetNameComponent} from "./dialog-set-name/dialog-set-name.component";
import {MatDialog} from "@angular/material/dialog";
import {fromEvent, Subscription} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {LoaderService} from "../loader/loader.service";
import {DocumentServiceService} from "./document-service/document-service.service";
//import {RemoteCursorManager} from "@convergencelabs/monaco-collab-ext"
import {EditorContentManager, RemoteCursorManager} from "../../monaco-collab-ext"

interface LoadedAssets {
  editorContent: boolean,
  component_init: boolean,
  remote_content_init: boolean,
  ngOnInit: boolean,
  editorOnInit: boolean
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
  client_cursors = new Map<string, number>;
  client_cursors_colors = new Map<string, string>;
  doc_uuid: string;
  //// Scroll sync
  subscriptions: Subscription[] = [];


  loadedAssets: LoadedAssets = {
    editorContent: false,
    editorOnInit: false,
    ngOnInit: false,
    component_init: false,
    remote_content_init: false
  }
  //loadedAssets = new Map<string, boolean>(("a", false));

  @ViewChild('textareaRef') textareaRef!: ElementRef;
  @ViewChild('themeButton') themeButtonRef!: ElementRef;
  @ViewChild('active_editorRef') active_editorRef!: ElementRef;

  @ViewChild('editor_container') editor_container!: ElementRef;
  @ViewChild('result_displayer') result_displayer!: ElementRef;
  @ViewChild('editor_cursor_container_ref') editor_cursor_container!: ElementRef;
  @ViewChild('imageInput') imageInputElement!: ElementRef;

  @ViewChild('editorSwitcherTemplate', { static: true }) editorSwitcherTemplateRef!: TemplateRef<any>;
  @ViewChild('otherUsersTemplate', { static: true }) otherUsersTemplateRef!: TemplateRef<any>;
  @ViewChild('documentTitle', { static: true }) documentTitleRef!: TemplateRef<any>;
  //@ViewChild('activeEditorRef') active_editor!: ElementRef;


  readonly dialog = inject(MatDialog);
  protected editorRef: any;   // Not Ngx detailed ICodeEditor https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.ICodeEditor.html
  private previousResultDisplayerScrollTop: number;
  private previousEditorScrollTop: number;
  protected connectedUsers = new Map<string, DbUser>();
  //protected mainLoaderValue: number = 10;

  constructor(protected router: Router, private route: ActivatedRoute, private socket: SocketioService, private errorSnackBar: MatSnackBar, private toolbarService: ToolbarService, private loadingService: LoaderService, protected documentService: DocumentServiceService) {
  }

  getLoadPercent() : number {
    let count = 0;
    let loaded = 0;
    for(let asset in this.loadedAssets) {
      if(this.loadedAssets[asset as keyof LoadedAssets]) {
        loaded += 1
      } else {
        console.debug(`Waiting for ${asset}`);
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
    //this.mainLoaderValue += 20;
    this.loadedAssets.component_init = true;
  }

  cursorsTimeOut: any[] = [];
  setMonacoCode(newCode: string) {
    if(this.editorRef === undefined) {
      console.warn("this.editorRef is undefined, retrying in 1sec");
      setTimeout(() => {this.setMonacoCode(newCode)}, 1000);
      return;
    }
    const bckpSelection = this.editorRef.getSelection();

    this.cursorsTimeOut = [];
    //this.monacoCode = newCode;

    const contentManager = new EditorContentManager({
      editor:this.editorRef,

    });
    contentManager.replace(0, this.monacoCode.length, newCode);
    this.editorRef.setSelection(bckpSelection);
    this.loadedAssets.editorContent = true;
    //if(this.mainLoaderValue < 100) {this.mainLoaderValue += 10}
    //console.log("Setting cursors at good position");
    //console.log(this.client_cursors);
    //for(let timeout of [100,200,300,400,500]) {
    //  this.cursorsTimeOut.push(
    //      setTimeout(() => {
    //        for(let client_id of this.client_cursors.keys()) {
    //          //console.log(`Having : ${client_id} : ${this.client_cursors.get(client_id.toString())}`);
    //          this.remoteCursorManager.setCursorOffset(client_id.toString(), this.client_cursors.get(client_id.toString())!);
    //        }
    //      }, timeout)
    //  );
    //}


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
      //this.documentInfos = data["document"];
      this.documentService.documentInfos = data["document"];
      this.updatedHtml = data["html"];
      this.result_displayer.nativeElement.innerHTML = this.updatedHtml;
      //this.mainLoaderValue = 100;
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
      //this.documentInfos.doc_name = data["document"]["doc_name"];
      //console.log("Received document infos : ", this.documentInfos);
      console.log("Received document infos : ", this.documentService.documentInfos);
    });

    this.socket.on("update", (data: any) => this.remoteContentUpdate(data));

    this.socket.on("client_cursor_update", (data: any) => {
      console.log("CURSOR EVENT");
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
    //this.subscriptions.push(fromEvent(window, 'wheel').subscribe( e => {
    //  console.log("Wheel event");
    //  this.syncScroll();
    //}))

    this.socket.connected_user_list_observe().subscribe((connectedUsers) => {
      console.log("Connected users : ", connectedUsers);
      this.connectedUsers = connectedUsers;
      for(let client_id of this.connectedUsers.keys()) {
        if(!this.client_cursors_colors.get(client_id.toString())) {
          this.client_cursors_colors.set(client_id.toString(), this.generateRandomColor());
        }
        // todo : Remove old users
        // todo : thread ping pong
      }

    })
    //this.mainLoaderValue += 10
    this.loadedAssets.ngOnInit = true;
  }

  editorOnInit(editor: any) {
    this.editorRef = editor;
    this.remoteCursorManager = new RemoteCursorManager({
      editor: this.editorRef,
      tooltips: true,
      tooltipDuration: 200
    })

    //let cursor = this.remoteCursorManager.addCursor("jDoe", "blue", ".");
    //cursor.setOffset(4);
    //cursor.show();
    //setInterval(() => {cursor.setOffset(cursor.getPosition().column+1)}, 2000);



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
    //this.mainLoaderValue += 20;
    this.loadedAssets.editorOnInit = true;
  }



  // make sure to destory the editor
  ngOnDestroy(): void {
    this.socket.emit("leave_room", this.doc_uuid);
    document.getElementById("editorSwitcher")!.style.visibility = "hidden";
    //this.editor.destroy();
    this.toolbarService.removeElement(this.editorSwitcherTemplateRef);
    this.toolbarService.removeElement(this.documentTitleRef);
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
      console.log(`Remote update ID (${data['update_id']}) <= our update ID(${this.updateId})`)
    }
    this.updatedContent = data["content"];
    this.setMonacoCode(this.updatedContent);
    this.updateRemoteCursorPosition(data["client_id"], data["cursor_position"]);
  }
  onChange() {
    //const textarea = this.getTextArea();
    //this.updatedContent = textarea?.value!;
    this.updatedContent = this.monacoCode;
    //const cursor_position = textarea?.selectionStart;
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

    //this.editorRef.layout();

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

  getTextArea() {
    const textarea = document.querySelector("textarea");
    if(!textarea) {
      console.error("Text area not found");
      return;
    }
    return textarea;
  }

  /////////

  updateRemoteCursorPosition(client_id: string, cursor_position: number) {
    if(client_id == this.clientId) {
        return;
    }
    if(this.client_cursors.get(client_id.toString()) === undefined) {
      if(!this.client_cursors_colors.get(client_id.toString())) {
        this.client_cursors_colors.set(client_id.toString(), this.generateRandomColor());
      }
      let cursor = this.remoteCursorManager.addCursor(client_id.toString(), this.client_cursors_colors.get(client_id.toString())!, "|");
      cursor.show();
      cursor.setOffset(0);
    }

    this.remoteCursorManager.setCursorOffset(client_id.toString(), cursor_position);
    this.client_cursors.set(client_id.toString(), cursor_position);
  }

  updateLocalCursorPosition(_: any) {
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


    console.log("Selections :", this.editorRef.getSelections())
    console.log("Found start : ", foundStart);
    console.log("Found end : ", foundEnd);
    return {
      foundStart,
      foundEnd
    }
  }

  formatToken(event: Event, format_char: string) {
    let {foundStart, foundEnd} = this.getCaretPositionInText();
    console.log(`Found start : ${foundStart}`);
    console.log(`Found end : ${foundEnd}`);
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
    let {foundStart, foundEnd} = this.getCaretPositionInText();
    //foundStart -= 1;
    //foundEnd -= 1;

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
    this.imageInputElement.nativeElement.click();
  }

  onImageSelected(event: any) {
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
      //const textArea = this.getTextArea();
      //let foundStart = textArea?.selectionStart!;
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
      //data: {"doc_name": this.documentInfos.doc_name}
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


}
