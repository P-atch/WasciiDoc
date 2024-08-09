import {Injectable, TemplateRef} from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ToolbarService {

  private toolbarElementsSubjectLeft = new BehaviorSubject<TemplateRef<any>[]>([]);
  private toolbarElementsSubjectRight = new BehaviorSubject<TemplateRef<any>[]>([]);
  toolbarElementsLeft$ = this.toolbarElementsSubjectLeft.asObservable();
  toolbarElementsRight$ = this.toolbarElementsSubjectRight.asObservable();

  addElement(element: any, position: string ="left") {
    if(position === "left") {
      const currentElements = this.toolbarElementsSubjectLeft.value;
      this.toolbarElementsSubjectLeft.next([...currentElements, element]);
    } else {
      const currentElements = this.toolbarElementsSubjectRight.value;
      this.toolbarElementsSubjectRight.next([...currentElements, element]);
    }
  }

  removeElement(element: any, position: string ="left") {
    if(position === "left") {
      const currentElements = this.toolbarElementsSubjectLeft.value.filter(el => el !== element);
      this.toolbarElementsSubjectLeft.next(currentElements);
    } else {
      const currentElements = this.toolbarElementsSubjectRight.value.filter(el => el !== element);
      this.toolbarElementsSubjectRight.next(currentElements);
    }
  }

  clearElements() {
    this.toolbarElementsSubjectLeft.next([]);
  }

  constructor() { }
}
