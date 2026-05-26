import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

import { ToastService } from '../../../core/services/toast.service';
import { QueryBuilder } from '../../../core/utils/query-builder';
import { AddEditPageLayoutComponent } from '../../../shared/components/layout/add-edit-page-layout/add-edit-page-layout.component';
import { AppInputComponent } from '../../../shared/components/app-input/app-input.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/components/app-select/app-select.component';
import { AppTextareaComponent } from '../../../shared/components/app-textarea/app-textarea.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import {
  AppTableComponent,
  AppTableColumn,
  AppTableAction,
  AppTableActionEvent,
} from '../../../shared/components/app-table/app-table.component';
import { AppEmptyStateComponent } from '../../../shared/components/app-empty-state/app-empty-state.component';
import { AppLoadingStateComponent } from '../../../shared/components/app-loading-state/app-loading-state.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StrategyService } from '../services/strategy.service';
import { StrategyRuleService } from '../services/strategy-rule.service';
import {
  MARKET_TYPES,
  MarketType,
  Strategy,
  StrategyRule,
  StrategyRuleCategory,
  UpdateStrategyRequest,
} from '../models/strategy.model';
import {
  StrategyRuleDialogComponent,
  StrategyRuleDialogData,
} from '../rule-dialog/strategy-rule-dialog.component';

function hexColorValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const value = (control.value as string) ?? '';
    if (!value) return null;
    return /^#[0-9A-Fa-f]{6}$/.test(value) ? null : { hexColor: true };
  };
}

interface StrategyRuleRow extends Record<string, unknown> {
  id: string;
  strategyId: string;
  order: number;
  title: string;
  category: StrategyRuleCategory;
  importance: string;
  isRequired: boolean;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  modifiedAt: string;
  categoryDisplay: string;
  importanceDisplay: string;
  isRequiredDisplay: string;
}

@Component({
  selector: 'app-strategy-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    AddEditPageLayoutComponent,
    AppInputComponent,
    AppSelectComponent,
    AppTextareaComponent,
    AppButtonComponent,
    AppTableComponent,
    AppEmptyStateComponent,
    AppLoadingStateComponent,
  ],
  templateUrl: './strategy-form.component.html',
  styleUrl: './strategy-form.component.scss',
})
export class StrategyFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(StrategyService);
  private readonly ruleService = inject(StrategyRuleService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  isEditMode = false;
  strategyId: string | null = null;
  submitted = false;

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly rules = signal<StrategyRule[]>([]);
  readonly isLoadingRules = signal(false);

  readonly marketTypeOptions: AppSelectOption[] = MARKET_TYPES.map(type => ({
    label: this.translate.instant(`STRATEGIES.MARKET_TYPES.${type.toUpperCase()}`),
    value: type,
  }));

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['' as string | null],
    marketType: [null as MarketType | null, Validators.required],
    color: ['' as string | null, hexColorValidator()],
  });

  readonly colorValue = computed(() => this.form.get('color')?.value ?? '');

  readonly ruleColumns: AppTableColumn<StrategyRuleRow>[] = [
    { key: 'order', label: '#', align: 'center' },
    { key: 'title', label: this.translate.instant('STRATEGIES.RULES.COLUMNS.TITLE') },
    { key: 'categoryDisplay', label: this.translate.instant('STRATEGIES.RULES.COLUMNS.CATEGORY') },
    { key: 'importanceDisplay', label: this.translate.instant('STRATEGIES.RULES.COLUMNS.IMPORTANCE') },
    { key: 'isRequiredDisplay', label: this.translate.instant('STRATEGIES.RULES.COLUMNS.REQUIRED'), align: 'center' },
  ];

  readonly ruleActions: AppTableAction<StrategyRuleRow>[] = [
    { id: 'edit', label: this.translate.instant('COMMON.ACTIONS.EDIT'), icon: 'edit' },
    {
      id: 'deactivate',
      label: this.translate.instant('COMMON.ACTIONS.DEACTIVATE'),
      icon: 'remove_circle_outline',
      tone: 'neutral',
      disabled: (row) => !row.isActive,
    },
    { id: 'hard-delete', label: this.translate.instant('COMMON.ACTIONS.HARD_DELETE'), icon: 'delete_forever', tone: 'danger' },
  ];

  readonly displayRules = computed<StrategyRuleRow[]>(() =>
    this.rules().map(rule => ({
      ...rule,
      categoryDisplay: this.translate.instant(
        `STRATEGIES.RULES.CATEGORIES.${this.categoryKey(rule.category)}`
      ),
      importanceDisplay: this.translate.instant(
        `STRATEGIES.RULES.IMPORTANCES.${rule.importance.toUpperCase()}`
      ),
      isRequiredDisplay: rule.isRequired ? '✓' : '—',
    }))
  );

  ngOnInit(): void {
    this.strategyId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.strategyId;

    if (this.isEditMode) {
      this.loadStrategy();
      this.loadRules();
    }
  }

  onSave(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isSaving.set(true);

    if (this.isEditMode) {
      this.submitUpdate();
    } else {
      this.submitCreate();
    }
  }

  onBack(): void {
    this.router.navigate(['/strategies']);
  }

  onAddRule(): void {
    this.openRuleDialog();
  }

  onRuleAction(event: AppTableActionEvent<StrategyRuleRow>): void {
    if (event.action === 'edit') {
      const rule = this.rules().find(r => r.id === event.row.id);
      if (rule) this.openRuleDialog(rule);
    } else if (event.action === 'deactivate') {
      this.confirmRuleSoftDelete(event.row.id);
    } else if (event.action === 'hard-delete') {
      this.confirmRuleHardDelete(event.row.id);
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
    if (ctrl.hasError('hexColor')) return this.translate.instant('STRATEGIES.ERRORS.HEX_COLOR');
    return '';
  }

  private loadStrategy(): void {
    this.isLoading.set(true);
    this.service.getById(this.strategyId!).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (strategy: Strategy) => {
        this.form.patchValue({
          name: strategy.name,
          description: strategy.description ?? '',
          marketType: strategy.marketType,
          color: strategy.color ?? '',
        });
      },
      error: () => this.router.navigate(['/strategies']),
    });
  }

  private loadRules(): void {
    this.isLoadingRules.set(true);
    this.ruleService.getAll(this.strategyId!, new QueryBuilder().setPage(0, 200)).pipe(
      finalize(() => this.isLoadingRules.set(false))
    ).subscribe({
      next: (response) => this.rules.set(response.model ?? []),
    });
  }

  private submitCreate(): void {
    const value = this.form.getRawValue();
    const request = {
      name: value.name!.trim(),
      description: value.description?.trim() || undefined,
      marketType: value.marketType!,
      color: value.color?.trim() || undefined,
    };

    this.service.create(request).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (res) => {
        this.toastService.success('STRATEGIES.CREATE_SUCCESS');
        this.router.navigate(['/strategies', res.id, 'edit']);
      },
    });
  }

  private submitUpdate(): void {
    const value = this.form.getRawValue();
    const request: UpdateStrategyRequest = {
      name: value.name!.trim(),
      description: value.description?.trim() || undefined,
      marketType: value.marketType!,
      color: value.color?.trim() || undefined,
    };

    this.service.update(this.strategyId!, request).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => this.toastService.success('STRATEGIES.UPDATE_SUCCESS'),
    });
  }

  private openRuleDialog(rule?: StrategyRule): void {
    const data: StrategyRuleDialogData = {
      strategyId: this.strategyId!,
      rule,
      nextOrder: this.rules().length + 1,
    };

    this.dialog.open(StrategyRuleDialogComponent, { data, width: '560px' })
      .afterClosed()
      .subscribe((saved: boolean) => {
        if (saved) this.loadRules();
      });
  }

  private confirmRuleSoftDelete(ruleId: string): void {
    const data: ConfirmDialogData = {
      title: this.translate.instant('STRATEGIES.RULES.CONFIRM_DELETE.TITLE'),
      message: this.translate.instant('STRATEGIES.RULES.CONFIRM_DELETE.MESSAGE'),
      confirmText: this.translate.instant('STRATEGIES.RULES.CONFIRM_DELETE.CONFIRM'),
      cancelText: this.translate.instant('COMMON.ACTIONS.CANCEL'),
      type: 'warning',
    };
    this.dialog.open(ConfirmDialogComponent, { data }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.softDeleteRule(ruleId);
    });
  }

  private softDeleteRule(ruleId: string): void {
    this.ruleService.softDelete(this.strategyId!, ruleId).subscribe({
      next: () => {
        this.toastService.success('STRATEGIES.RULES.DELETE_SUCCESS');
        this.loadRules();
      },
    });
  }

  private confirmRuleHardDelete(ruleId: string): void {
    const data: ConfirmDialogData = {
      title: this.translate.instant('STRATEGIES.RULES.CONFIRM_HARD_DELETE.TITLE'),
      message: this.translate.instant('STRATEGIES.RULES.CONFIRM_HARD_DELETE.MESSAGE'),
      confirmText: this.translate.instant('STRATEGIES.RULES.CONFIRM_HARD_DELETE.CONFIRM'),
      cancelText: this.translate.instant('COMMON.ACTIONS.CANCEL'),
      type: 'danger',
    };
    this.dialog.open(ConfirmDialogComponent, { data }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.hardDeleteRule(ruleId);
    });
  }

  private hardDeleteRule(ruleId: string): void {
    this.ruleService.hardDelete(this.strategyId!, ruleId).subscribe({
      next: () => {
        this.toastService.success('STRATEGIES.RULES.HARD_DELETE_SUCCESS');
        this.loadRules();
      },
    });
  }

  private categoryKey(category: StrategyRuleCategory): string {
    return category
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');
  }
}
