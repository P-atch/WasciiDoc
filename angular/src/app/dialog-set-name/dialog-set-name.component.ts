import {ChangeDetectionStrategy, Component, inject, model} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import {MatButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatFormField} from "@angular/material/form-field";

export interface DialogData {
  doc_name: string;
}

@Component({
  selector: 'app-dialog-set-name',
  standalone: true,
    imports: [
        MatDialogContent,
        MatDialogTitle,
        MatButton,
        MatDialogClose,
        MatDialogActions,
        MatInput,
        FormsModule,
        MatFormField
    ],
  templateUrl: './dialog-set-name.component.html',
  styleUrl: './dialog-set-name.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogSetNameComponent {
  readonly dialogRef = inject(MatDialogRef<DialogSetNameComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly doc_name = model(this.data.doc_name)

  onNoClick(): void {
    this.dialogRef.close();
  }
}
