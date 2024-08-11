import {Injectable, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {SocketioService} from "../../socketio/socketio.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ToolbarService} from "../../toolbar/toolbar.service";
import {LoaderService} from "../../loader/loader.service";
import {AuthService} from "../../../auth/auth.service";

export interface DocumentInfo {
  "doc_name": string,
  "doc_uuid": string,
  "owner": number,
  "restriction": number,
  "owner_known_name": string
}

@Injectable({
  providedIn: 'root'
})
export class DocumentServiceService implements OnInit {
  documentInfos: DocumentInfo = {
    doc_name: "",
    doc_uuid: "",
    owner: -1,
    restriction: -1,
    owner_known_name: ""
  }

  constructor(private router: Router, private route: ActivatedRoute,
              private socket: SocketioService, private errorSnackBar: MatSnackBar,
              private toolbarService: ToolbarService, private loadingService: LoaderService,
              protected authService: AuthService) {
  }
  ngOnInit() {
  }

  isReadOnly() : boolean {
    if(this.documentInfos.restriction >= 4) {
      return false;
    }
    if(this.documentInfos.restriction >= 3 && this.authService.userInfos?.user_unique_identifier != 0 && this.authService.userInfos?.user_unique_identifier != undefined) {
      return false;
    }
    console.log("Owner : ", this.documentInfos.owner);
    if(this.documentInfos.owner == this.authService.userInfos?.user_unique_identifier) {
      return false;
    }
    return true;
  }
}
