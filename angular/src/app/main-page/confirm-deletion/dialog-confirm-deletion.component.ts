import {Component, inject, model} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogClose, MatDialogContent, MatDialogTitle} from "@angular/material/dialog";
import {MatButton} from "@angular/material/button";
import {DialogData} from "../../dialog-set-name/dialog-set-name.component";

@Component({
  selector: 'app-confirm-deletion',
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogTitle,
    MatDialogClose,
    MatButton
  ],
  templateUrl: './dialog-confirm-deletion.component.html',
  styleUrl: './dialog-confirm-deletion.component.css'
})
export class DialogConfirmDeletionComponent {
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly doc_name = model(this.data.doc_name);
}
