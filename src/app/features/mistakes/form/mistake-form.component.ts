import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AddEditPageLayoutComponent } from '../../../shared/components/layout/add-edit-page-layout/add-edit-page-layout.component';
import { AppInputComponent } from '../../../shared/components/app-input/app-input.component';
import { AppTextareaComponent } from '../../../shared/components/app-textarea/app-textarea.component';
import { MistakeService } from '../services/mistake.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-mistake-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AddEditPageLayoutComponent,
    AppInputComponent,
    AppTextareaComponent,
  ],
  templateUrl: './mistake-form.component.html',
})
export class MistakeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MistakeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  id: string | null = null;
  submitted = false;
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(1000)],
  });

  get editing(): boolean {
    return !!this.id;
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) this.load();
  }

  error(name: string): string {
    const control = this.form.get(name);
    if (!control || (!this.submitted && !control.touched)) return '';
    if (control.hasError('required')) return this.translate.instant('ERRORS.REQUIRED');
    if (control.hasError('maxlength')) {
      return this.translate.instant('ERRORS.MAX_LENGTH', {
        max: control.getError('maxlength').requiredLength,
      });
    }
    return '';
  }

  save(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request = {
      name: value.name!.trim(),
      description: value.description?.trim() || null,
    };
    const call = this.id
      ? this.service.update(this.id, request)
      : this.service.create(request);

    this.saving.set(true);
    call.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: response => {
        this.toast.success(this.id ? 'MISTAKES.UPDATE_SUCCESS' : 'MISTAKES.CREATE_SUCCESS');
        if (!this.id) this.router.navigate(['/mistakes', response.id, 'edit']);
      },
    });
  }

  back(): void {
    this.router.navigate(['/mistakes']);
  }

  private load(): void {
    if (!this.id) return;
    this.loading.set(true);
    this.service.getById(this.id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: mistake => {
        this.form.patchValue({
          name: mistake.name,
          description: mistake.description ?? '',
        });
      },
      error: () => this.router.navigate(['/mistakes']),
    });
  }
}
