import {Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {MatIcon} from "@angular/material/icon";
import {MatButton, MatFabButton} from "@angular/material/button";
import {ToolbarService} from "../toolbar/toolbar.service";
import {
  MatCard, MatCardActions,
  MatCardAvatar,
  MatCardContent,
  MatCardHeader,
  MatCardImage,
  MatCardSubtitle,
  MatCardTitle
} from "@angular/material/card";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {NgForOf, NgIf, NgOptimizedImage} from "@angular/common";
import {DbDocument, SocketioService} from "../socketio/socketio.service";
import {AuthService} from "../../auth/auth.service";
import {Socket} from "ngx-socket-io";
import {MatGridList, MatGridTile} from "@angular/material/grid-list";
import {Subscription} from "rxjs";
import {LoaderService} from "../loader/loader.service";
import {MatExpansionPanelTitle} from "@angular/material/expansion";
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {MatTooltip} from "@angular/material/tooltip";

@Component({
  selector: 'app-main-page',
  standalone: true,
    imports: [
        MatIcon,
        MatFabButton,
        MatCardContent,
        MatCardImage,
        MatCardSubtitle,
        MatCardAvatar,
        MatCardTitle,
        MatCardHeader,
        MatCard,
        MatButton,
        MatCardActions,
        NgOptimizedImage,
        NgIf,
        MatGridList,
        MatGridTile,
        NgForOf,
        MatExpansionPanelTitle,
        MatTabGroup,
        MatTab,
        MatTooltip
    ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css',
})
export class MainPageComponent implements OnInit, OnDestroy {
  listDocumentsSubscription: Subscription;
  documents: DbDocument[] = [];

  @ViewChild('newDocumentTemplate', { static: true }) newDocumentTemplate!: TemplateRef<any>;
  constructor(private router: Router, private toolbarService: ToolbarService, protected auth: AuthService, private socket: SocketioService, private loadingService: LoaderService) {}



  ngOnInit() {
    console.log("On Init called");
    this.loadingService.resetLoading();
    this.toolbarService.addElement(this.newDocumentTemplate, "right");
    this.loadingService.increaseLoading();
    this.listDocumentsSubscription = this.socket.listDocuments().subscribe(documents => {
        this.documents = documents;
        this.loadingService.decreaseLoading();
    })
  }

  ngOnDestroy() {
    this.toolbarService.removeElement(this.newDocumentTemplate, "right");
    this.listDocumentsSubscription.unsubscribe();
  }
  navigateToEditor() {
    this.router.navigate(["/editor"]);
  }
  newDocument(example = false) {
    this.socket.once("create_document", (data: any) => {
      //this.loadingService.decreaseLoading();
      if(!data["document"]["doc_uuid"]) {
        console.error("Invalid document received : ", data);
        return;
      }
      this.router.navigate(["/editor", data["document"]["doc_uuid"]]);
    })
    this.socket.emit("create_document", {"example": example});

  }

    deleteDocument(doc_uuid: string) {
      this.loadingService.increaseLoading();
      this.socket.once("delete_document", () => {
          console.log("Document delete callback received");
          this.loadingService.decreaseLoading();
          this.socket.listDocuments();
      })

      this.socket.emit("delete_document", {"document": {"doc_uuid": doc_uuid}});

    }
}
