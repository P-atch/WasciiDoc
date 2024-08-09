import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

const config: SocketIoConfig = { url: "http://localhost:5000", options: {} };

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SocketIoModule.forRoot(config)
  ]
})
export class SocketioModule {
  constructor() {

  }

  maFonction(): void {
    console.log("Hey");

  }
}
