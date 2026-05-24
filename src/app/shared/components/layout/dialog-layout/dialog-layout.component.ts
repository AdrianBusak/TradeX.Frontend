import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AppButtonComponent, ButtonVariant } from '../../app-button/app-button.component';

@Component({
  selector: 'app-dialog-layout',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, AppButtonComponent],
  templateUrl: './dialog-layout.component.html',
  styleUrl: './dialog-layout.component.scss'
})
export class DialogLayoutComponent {
  title = input.required<string>();
  headerColor = input<string>(''); 
  headerTextVariant = input<'light' | 'dark'>('dark');
  showDialogActions = input<boolean>(true);
  
  confirmLabel = input<string>('Save');
  cancelLabel = input<string>('Cancel');
  confirmDisabled = input<boolean>(false);
  confirmColor = input<ButtonVariant>('primary');
  
  confirmed = output<void>();
  cancelled = output<void>();
  
  private dialogRef = inject(MatDialogRef, { optional: true });

  onClose() {
    this.cancelled.emit();
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onConfirm() {
    this.confirmed.emit();
  }
}
