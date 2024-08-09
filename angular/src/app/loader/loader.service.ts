import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private sharedValueSubject = new BehaviorSubject<number>(0);
  loading$ = this.sharedValueSubject.asObservable();

  constructor() { }

  increaseLoading() {
    console.log("Increasing")
    this.sharedValueSubject.next(this.sharedValueSubject.value+1)
  }
  decreaseLoading() {
    console.log("Decreasing")
    if(this.sharedValueSubject.value > 0) {
      this.sharedValueSubject.next(this.sharedValueSubject.value-1)
    }
  }

  resetLoading() {
    this.sharedValueSubject.next(0);
  }
}
