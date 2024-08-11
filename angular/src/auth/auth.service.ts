import {Injectable, OnInit} from '@angular/core';
import {SocketioService} from "../app/socketio/socketio.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnInit{
  authMethods: string[] = [];
  private authMethodsFetched = false;
  userInfos: {"username": string, "profile_image_url": string|undefined, "user_unique_identifier": number} | null = null;
  private userInfosFetched = false;
  constructor(private socket: SocketioService) {
    this.getAuthMethods();
    this.getUserInfos();
  }

  ngOnInit() {
  }

  private getUserInfos()  {
    if(this.userInfosFetched) {
      return;
    }
    console.log("Getting user infos");
    this.socket.once("get_userinfos", (data: any) => {
      if(data["user"] === undefined) {
        console.error("Invalid user infos received : ", data)
      }
      this.userInfos = data["user"];
      this.userInfosFetched = true;
      console.log("User infos received : ", data["user"]);
    })
    this.socket.emit("get_userinfos");
  }

  private getAuthMethods() {
    if(this.authMethodsFetched) {
      return;
    }
    console.log("Getting auth methods");
    this.socket.once("get_auth_methods", (data: any) => {
      if(data["auth_methods"] == undefined) {
        console.error("Invalid auth methods received : ", data)
      }
      this.authMethods = data["auth_methods"];
      this.authMethodsFetched = true;
      console.log("Auth methods received : ", data["auth_methods"]);
    })
    this.socket.emit("get_auth_methods");
  }

}
