import {
  Component,
  computed,
  ElementRef, EventEmitter,
  inject,
  model,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MatMenu, MatMenuItem, MatMenuTrigger, MenuCloseReason} from "@angular/material/menu";
import {MatTooltip} from "@angular/material/tooltip";
import {MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger} from "@angular/material/autocomplete";
import {MatChipGrid, MatChipInput, MatChipInputEvent, MatChipRow} from "@angular/material/chips";
import {FormsModule} from "@angular/forms";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {ToolbarService} from "../../toolbar/toolbar.service";
import {SocketioService} from "../../socketio/socketio.service";
import {DocumentServiceService} from "../document-service/document-service.service";
import {LoaderService} from "../../loader/loader.service";
import {MatOption} from "@angular/material/core";

@Component({
  selector: 'app-doc-owners',
  standalone: true,
  imports: [
    MatButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatTooltip,
    MatMenuTrigger,
    MatAutocomplete,
    MatChipInput,
    FormsModule,
    MatAutocompleteTrigger,
    MatChipRow,
    MatChipGrid,
    MatLabel,
    MatFormField,
    MatOption
  ],
  templateUrl: './doc-owners.component.html',
  styleUrl: './doc-owners.component.css'
})
export class DocOwnersComponent implements OnInit, OnDestroy{
  @ViewChild('documentOwners', { static: true }) documentOwnersRef!: TemplateRef<any>;
  constructor(private toolbarService: ToolbarService, private socket: SocketioService, protected documentService: DocumentServiceService, private loaderService: LoaderService) {}
  /*readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly currentFruit = model('');
  readonly fruits = signal(['Lemon']);
  readonly allFruits: string[] = ['Apple', 'Lemon', 'Lime', 'Orange', 'Strawberry'];
  readonly filteredFruits = computed(() => {
    const currentFruit = this.currentFruit().toLowerCase();
    return currentFruit
      ? this.allFruits.filter(fruit => fruit.toLowerCase().includes(currentFruit))
      : this.allFruits.slice();
  });

  }

  readonly announcer = inject(LiveAnnouncer);

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our fruit
    if (value) {
      this.fruits.update(fruits => [...fruits, value]);
    }

    // Clear the input value
    this.currentFruit.set('');
  }

  remove(fruit: string): void {
    this.fruits.update(fruits => {
      const index = fruits.indexOf(fruit);
      if (index < 0) {
        return fruits;
      }

      fruits.splice(index, 1);
      this.announcer.announce(`Removed ${fruit}`);
      return [...fruits];
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.fruits.update(fruits => [...fruits, event.option.viewValue]);
    this.currentFruit.set('');
    event.option.deselect();
  }*/

  ngOnInit() {
    this.toolbarService.addElement(this.documentOwnersRef);
    //this.loaderService.increaseLoading();
    //this.socket.once("get_userinfos", (data: any) => {
    //  this.loaderService.decreaseLoading();
    //  console.log(data);
    //  this.ownerUsername = data["user"]["username"];
//
    //})
    //console.log("Document owner : ", this.documentService.documentInfos.owner)
    //this.socket.emit("get_userinfos", this.documentService.documentInfos.owner)
  }
  ngOnDestroy() {
    this.toolbarService.removeElement(this.documentOwnersRef);
  }
}
