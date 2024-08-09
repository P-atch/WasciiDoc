import { NgModule } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {EditorComponent} from "./editor.component";
import {FormsModule} from "@angular/forms";
import { NgxEditorModule } from 'ngx-editor';
import { ResizableModule } from 'angular-resizable-element';
import {Highlight} from 'ngx-highlightjs';
import {HighlightLineNumbers} from "ngx-highlightjs/line-numbers";
import {MatButtonToggle, MatButtonToggleGroup} from "@angular/material/button-toggle";
import {MatIcon} from "@angular/material/icon";
import { SocketioModule } from "../socketio/socketio.module"
import {MatToolbar} from "@angular/material/toolbar";
import {MatButton, MatFabButton, MatIconButton, MatMiniFabButton} from "@angular/material/button";
import {MonacoEditorModule} from "ngx-monaco-editor-v2";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {DocumentRestrictionComponent} from "./document-restriction/document-restriction.component";
import {DocOwnersComponent} from "./doc-owners/doc-owners.component";
import {MatTooltip} from "@angular/material/tooltip";
import {
    MatAccordion, MatExpansionModule, MatExpansionPanel,
    MatExpansionPanelDescription,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle
} from "@angular/material/expansion";
import {MatCardContent} from "@angular/material/card";
import {MatDivider} from "@angular/material/divider";
import {MatList} from "@angular/material/list";
import {MatSlider, MatSliderThumb} from "@angular/material/slider";
import {MatProgressBar} from "@angular/material/progress-bar";



@NgModule({
  declarations: [EditorComponent],
  exports: [
    EditorComponent
  ],
    imports: [
        CommonModule,
        //CodemirrorModule,
        FormsModule,
        NgxEditorModule,
        ResizableModule,
        Highlight,
        HighlightLineNumbers,
        MatButtonToggleGroup,
        MatButtonToggle,
        MatIcon,
        SocketioModule,
        MatToolbar,
        MatIconButton,
        MatMiniFabButton,
        MonacoEditorModule,
        MatMenu,
        MatMenuTrigger,
        MatButton,
        MatMenuItem,
        DocumentRestrictionComponent,
        DocOwnersComponent,
        MatTooltip,
        MatExpansionPanelHeader,
        MatFabButton,
        MatCardContent,
        MatDivider,
        MatList,
        NgOptimizedImage,
        MatSlider,
        MatSliderThumb,
        MatProgressBar

    ],
    bootstrap: [EditorComponent]
})
export class EditorModule {

}
