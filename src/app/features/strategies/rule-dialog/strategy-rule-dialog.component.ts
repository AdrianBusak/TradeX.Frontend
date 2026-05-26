import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { finalize } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ToastService } from '../../../core/services/toast.service';
import { DialogLayoutComponent } from '../../../shared/components/layout/dialog-layout/dialog-layout.component';
import { AppInputComponent } from '../../../shared/components/app-input/app-input.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/components/app-select/app-select.component';
import { AppTextareaComponent } from '../../../shared/components/app-textarea/app-textarea.component';
import { StrategyRuleService } from '../services/strategy-rule.service';
import {
  STRATEGY_RULE_CATEGORIES,
  STRATEGY_RULE_IMPORTANCES,
  StrategyRule,
  StrategyRuleCategory,
  StrategyRuleImportance,
} from '../models/strategy.model';

export interface StrategyRuleDialogData {
  strategyId: string;
  rule?: StrategyRule;
  nextOrder: number;
}

@Component({
  selector: 'app-strategy-rule-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatSlideToggleModule,
    DialogLayoutComponent,
    AppInputComponent,
    AppSelectComponent,
    AppTextareaComponent,
  ],
  templateUrl: './strategy-rule-dialog.component.html',
  styleUrl: './strategy-rule-dialog.component.scss',
})
export class StrategyRuleDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ruleService = inject(StrategyRuleService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly dialogRef = inject(MatDialogRef<StrategyRuleDialogComponent>);

  readonly isSaving = signal(false);
  submitted = false;
  isEditMode!: boolean;

  categoryOptions!: AppSelectOption[];
  importanceOptions!: AppSelectOption[];

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(300)]],
    description: ['' as string | null],
    order: [1, [Validators.required, Validators.min(1)]],
    isRequired: [false],
    category: [null as StrategyRuleCategory | null, Validators.required],
    importance: [null as StrategyRuleImportance | null, Validators.required],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: StrategyRuleDialogData) {
    this.isEditMode = !!data.rule;

    this.categoryOptions = STRATEGY_RULE_CATEGORIES.map(c => ({
      label: this.translate.instant(`STRATEGIES.RULES.CATEGORIES.${this.categoryKey(c)}`),
      value: c,
    }));

    this.importanceOptions = STRATEGY_RULE_IMPORTANCES.map(i => ({
      label: this.translate.instant(`STRATEGIES.RULES.IMPORTANCES.${i.toUpperCase()}`),
      value: i,
    }));

    if (data.rule) {
      this.form.patchValue({
        title: data.rule.title,
        description: data.rule.description ?? '',
        order: data.rule.order,
        isRequired: data.rule.isRequired,
        category: data.rule.category,
        importance: data.rule.importance,
      });
    } else {
      this.form.patchValue({ order: data.nextOrder });
    }
  }

  fieldError(fieldName: string): string {
    const ctrl = this.form.get(fieldName);
    if (!ctrl || (!ctrl.touched && !this.submitted)) return '';
    if (ctrl.hasError('required')) return this.translate.instant('ERRORS.REQUIRED');
    if (ctrl.hasError('maxlength')) {
      const max = (ctrl.getError('maxlength') as { requiredLength: number }).requiredLength;
      return this.translate.instant('ERRORS.MAX_LENGTH', { max });
    }
    if (ctrl.hasError('min')) return this.translate.instant('ERRORS.MIN_VALUE');
    return '';
  }

  onConfirm(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isSaving.set(true);
    const value = this.form.getRawValue();
    const request = {
      title: value.title!.trim(),
      description: value.description?.trim() || undefined,
      order: Number(value.order),
      isRequired: value.isRequired!,
      category: value.category!,
      importance: value.importance!,
    };

    const op$ = this.isEditMode
      ? this.ruleService.update(this.data.strategyId, this.data.rule!.id, request)
      : this.ruleService.create(this.data.strategyId, request);

    op$.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.toastService.success(
          this.isEditMode ? 'STRATEGIES.RULES.UPDATE_SUCCESS' : 'STRATEGIES.RULES.CREATE_SUCCESS'
        );
        this.dialogRef.close(true);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private categoryKey(category: StrategyRuleCategory): string {
    return category
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');
  }
}
