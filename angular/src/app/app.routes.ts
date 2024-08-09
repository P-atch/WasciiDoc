import { Routes } from '@angular/router';
import {EditorComponent} from "./editor/editor.component";
import {MainPageComponent} from "./main-page/main-page.component";
import {Socket} from "ngx-socket-io";
import {EditorModule} from "./editor/editor.module";

export const routes: Routes = [
    {path: "editor/:doc_uuid", component: EditorComponent},
    {path: "", component: MainPageComponent}
];
