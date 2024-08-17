import { Injectable } from '@angular/core';
import {Socket, SocketIoConfig} from "ngx-socket-io";
import {Observable} from "rxjs";
import {appConfig} from "../app.config";

const config: SocketIoConfig = { url: window.origin, options: {} };

export interface DbDocument {
  doc_name: string;
  doc_uuid: string;
  owner: number;
  restriction: number;
  owner_known_name: string;
}

export interface ServerSuccess {
  message: string;
}

export interface ServerError {
  error: string;
  level: string|undefined;
  requiredAction: string|undefined;
}

export interface DbUser {
  username: string,
  profile_image_url: string,
  user_unique_identifier: string
}

export interface AppConfig {
  allow_anonymous_edit: boolean,
  allow_anonymous_creation: boolean,
}

@Injectable({
  providedIn: 'root'
})
export class SocketioService extends Socket {
  app_config: AppConfig = {
    allow_anonymous_edit: false,
    allow_anonymous_creation: false
  };

  constructor() {
    super(config)
    this.on("get_app_config", (data: any) => {
      this.app_config.allow_anonymous_edit = data["allow_anonymous_edit"];
      this.app_config.allow_anonymous_creation = data["allow_anonymous_creation"];
    });
    this.emit("get_app_config")
  }

  listDocuments(): Observable<DbDocument[]> {
    this.emit("list_documents");
    return new Observable<DbDocument[]>(observer => {
      this.on("list_documents", (data: any) => {
        // Assurez-vous que les données sont conformes à l'interface Document
        let documents: DbDocument[] = [];
        for(let data_doc of data) {
          documents.push({
            doc_uuid: data_doc.doc_uuid,
            doc_name: data_doc.doc_name,
            owner: data_doc.owner,
            restriction: data_doc.restriction,
            owner_known_name: data_doc.owner_known_name,
          });
          console.log(data_doc);
        }
        console.log(data);
        console.log("Received documents : ", documents);

        observer.next(documents);
      });

      // Clean up lorsque l'observable est détruit
      return () => {
        this.off("list_documents");
      };
    });
  }

  display_error_observe(): Observable<ServerError> {
    return new Observable<ServerError>(observer => {
      this.on("display_error", (data: any) => {
        let err: ServerError = {
          level: data["level"],
          error: data["error"],
          requiredAction: data["required_action"]
        };
        observer.next(err);
      });
      // Clean up lorsque l'observable est détruit
      return () => {
        this.off("display_error");
      };
    });
  }

  display_success_observe(): Observable<ServerSuccess> {
    return new Observable<ServerSuccess>(observer => {
      this.on("display_success", (data: any) => {
        let succ: ServerSuccess = {
          message: data["message"]
        };
        observer.next(succ);
      });
      // Clean up lorsque l'observable est détruit
      return () => {
        this.off("display_success");
      };
    });
  }

  connected_user_list_observe(): Observable<Map<string,DbUser>> {
    return new Observable<Map<string,DbUser>>(observer => {
      this.on("room_users", (data: any) => {
        console.log("Received users : ", data);
        let ret = new Map<string,DbUser>();
        for(let client_id in data) {
          ret.set(client_id, {
            username: data[client_id]["username"],
            profile_image_url: data[client_id]["profile_image_url"],
            user_unique_identifier: data[client_id]["user_unique_identifier"],
          })
        }
        observer.next(ret);
      });
      console.log("ERROR ?");
      // Clean up lorsque l'observable est détruit
      return () => {
        this.off("room_users");
      };
    });
  }
}
