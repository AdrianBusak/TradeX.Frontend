import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

import { DialogLayoutComponent } from '../../../shared/components/layout/dialog-layout/dialog-layout.component';
import { LotCalculatorFormComponent, LotCalculatorFormInitialData } from './lot-calculator-form.component';

export type LotCalculatorDialogData = LotCalculatorFormInitialData;

@Component({
  selector: 'app-lot-calculator-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, DialogLayoutComponent, LotCalculatorFormComponent],
  template: `
    <app-dialog-layout
      [title]="'LOT_CALCULATOR.TITLE' | translate"
      [showDialogActions]="false"
      (cancelled)="onCancel()">
      <app-lot-calculator-form
        [initialData]="dialogData"
        [showCancel]="true"
        (cancelled)="onCancel()" />
    </app-dialog-layout>
  `,
})
export class LotCalculatorDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<LotCalculatorDialogComponent>);
  readonly dialogData = inject<LotCalculatorDialogData>(MAT_DIALOG_DATA);

  onCancel(): void { this.dialogRef.close(null); }
}
