import {Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {MatButton, MatFabButton, MatMiniFabButton} from "@angular/material/button";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {ToolbarService} from "../../toolbar/toolbar.service";
import {SocketioService} from "../../socketio/socketio.service";
import {NgForOf} from "@angular/common";
import {DocumentServiceService} from "../document-service/document-service.service";
import {LoaderService} from "../../loader/loader.service";
import {MatIcon} from "@angular/material/icon";
import {MatTooltip} from "@angular/material/tooltip";



@Component({
  selector: 'app-document-restriction',
  standalone: true,
  imports: [
    MatButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatFabButton,
    MatMiniFabButton,
    NgForOf,
    MatIcon,
    MatTooltip
  ],
  templateUrl: './document-restriction.component.html',
  styleUrl: './document-restriction.component.css'
})
export class DocumentRestrictionComponent implements OnInit, OnDestroy {
  possiblePerms = new Map<number,string>();
  @ViewChild('documentRestriction', { static: true }) documentRestrictionRef!: TemplateRef<any>;
  constructor(private toolbarService: ToolbarService, private socket: SocketioService, protected documentService: DocumentServiceService, private loaderService: LoaderService) {
  }
  ngOnInit() {
    this.possiblePerms.set(4, "Editable");
    this.possiblePerms.set(3, "Limited");
    this.possiblePerms.set(2, "Locked");
    this.possiblePerms.set(1, "Protected");
    this.possiblePerms.set(0, "Private");
    console.log("Init document restriction");
    this.toolbarService.addElement(this.documentRestrictionRef);
  }
  ngOnDestroy() {
    this.toolbarService.removeElement(this.documentRestrictionRef)
  }

  changePermission(newPerm: number) {
    console.log(newPerm);
    this.loaderService.increaseLoading();
    this.documentService.documentInfos.restriction = newPerm;
    this.socket.emit("set_document_restriction", {"document": this.documentService.documentInfos});


  }


}
