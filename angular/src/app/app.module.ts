import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {AppComponent} from "./app.component";
import {SocketioModule} from "./socketio/socketio.module";
import {RouterModule, RouterOutlet} from "@angular/router";
import {EditorModule} from "./editor/editor.module";
import {MatToolbar} from "@angular/material/toolbar";
import {MatIcon} from "@angular/material/icon";
import {MatButton, MatFabButton, MatMiniFabButton} from "@angular/material/button";
import {MatDivider} from "@angular/material/divider";
import {NgForOf, NgOptimizedImage, NgTemplateOutlet} from "@angular/common";
import {MatButtonToggle, MatButtonToggleGroup} from "@angular/material/button-toggle";
import {MatProgressBar} from "@angular/material/progress-bar";
import {routes} from "./app.routes";
import {MonacoEditorModule, NgxMonacoEditorConfig} from "ngx-monaco-editor-v2";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {FormsModule} from "@angular/forms";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";

const monacoConfig: NgxMonacoEditorConfig = {
  baseUrl: 'assets', // configure base path for monaco editor. Starting with version 8.0.0 it defaults to './assets'. Previous releases default to '/assets'
  defaultOptions: { scrollBeyondLastLine: false }, // pass default options to be used
  onMonacoLoad: () => { console.log((<any>window).monaco); }, // here monaco object will be available as window.monaco use this function to extend monaco editor functionalities.
  requireConfig: { preferScriptTags: true }, // allows to oweride configuration passed to monacos loader
  monacoRequire: (<any>window).monacoRequire // pass here monacos require function if you loaded monacos loader (loader.js) yourself
};

@NgModule({
  declarations: [
    AppComponent
  ],
    imports: [
        BrowserModule,
        SocketioModule, RouterModule.forRoot(routes),
        EditorModule, MatToolbar, MatIcon, MatFabButton, MatDivider, NgOptimizedImage,
        MatButtonToggleGroup, MatButtonToggle, NgForOf, NgTemplateOutlet, MatMiniFabButton, MatProgressBar, BrowserAnimationsModule, FormsModule,
        MonacoEditorModule.forRoot(monacoConfig), MatButton, MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }