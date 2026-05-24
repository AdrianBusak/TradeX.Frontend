import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageLayoutComponent } from '../page-layout/page-layout.component';
import { TranslateModule } from '@ngx-translate/core';
import { AppButtonComponent } from '../../app-button/app-button.component';

@Component({
  selector: 'app-add-edit-page-layout',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule,
    PageLayoutComponent,
    TranslateModule,
    AppButtonComponent
  ],
  templateUrl: './add-edit-page-layout.component.html',
  styleUrl: './add-edit-page-layout.component.scss'
})
export class AddEditPageLayoutComponent {
  title = input.required<string>();
  loading = input<boolean>(false);
  
  saveDisabled = input<boolean>(false);
  saveHidden = input<boolean>(false);
  isSaving = input<boolean>(false);
  
  back = output<void>();
  save = output<void>();
}
