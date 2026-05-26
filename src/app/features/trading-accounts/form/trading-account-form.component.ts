import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { ToastService } from '../../../core/services/toast.service';
import { AddEditPageLayoutComponent } from '../../../shared/components/layout/add-edit-page-layout/add-edit-page-layout.component';
import { AppInputComponent } from '../../../shared/components/app-input/app-input.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/components/app-select/app-select.component';
import { TradingAccountService } from '../services/trading-account.service';
import {
  CreateTradingAccountRequest,
  TRADING_ACCOUNT_TYPES,
  TradingAccountType,
  UpdateTradingAccountRequest,
} from '../models/trading-account.model';

function exactLengthValidator(length: number): ValidatorFn {
  return (control: AbstractControl) => {
    const value = (control.value as string) ?? '';
    if (!value) return null;
    return value.length === length ? null : { exactLength: { required: length } };
  };
}

@Component({
  selector: 'app-trading-account-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatSlideToggleModule,
    AddEditPageLayoutComponent,
    AppInputComponent,
    AppSelectComponent,
  ],
  templateUrl: './trading-account-form.component.html',
  styleUrl: './trading-account-form.component.scss',
})
export class TradingAccountFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TradingAccountService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  isEditMode = false;
  accountId: string | null = null;
  submitted = false;

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly showCurrentBalance = signal(false);

  readonly accountTypeOptions: AppSelectOption[] = TRADING_ACCOUNT_TYPES.map(type => ({
    label: type === 'PropChallenge' ? 'Prop Challenge'
         : type === 'PropFunded'   ? 'Prop Funded'
         : type === 'BrokerLive'   ? 'Broker Live'
         : type,
    value: type,
  }));

  readonly form = this.fb.group({
    name:           ['', [Validators.required, Validators.maxLength(200)]],
    accountType:    [null as TradingAccountType | null, Validators.required],
    broker:         ['', [Validators.required, Validators.maxLength(200)]],
    currency:       ['', [Validators.required, exactLengthValidator(3)]],
    initialBalance: [null as number | null, [Validators.required, Validators.min(0)]],
    currentBalance: [null as number | null, [Validators.min(0)]],
  });

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.accountId;

    if (this.isEditMode) {
      this.showCurrentBalance.set(true);
      this.form.get('currentBalance')?.addValidators(Validators.required);
      this.form.get('currentBalance')?.updateValueAndValidity();
      this.loadAccount();
    }

    this.form.get('currency')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(val => {
      if (val && val !== val.toUpperCase()) {
        this.form.get('currency')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  onToggleCurrentBalance(): void {
    this.showCurrentBalance.update(v => !v);
    const ctrl = this.form.get('currentBalance');
    if (this.showCurrentBalance()) {
      ctrl?.addValidators(Validators.required);
    } else {
      ctrl?.removeValidators(Validators.required);
      ctrl?.reset(null);
    }
    ctrl?.updateValueAndValidity();
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
    this.router.navigate(['/trading-accounts']);
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
    if (ctrl.hasError('exactLength')) return this.translate.instant('TRADING_ACCOUNTS.ERRORS.CURRENCY_LENGTH');
    return '';
  }

  private loadAccount(): void {
    this.isLoading.set(true);
    this.service.getById(this.accountId!).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (account) => {
        this.form.patchValue({
          name:           account.name,
          accountType:    account.accountType,
          broker:         account.broker,
          currency:       account.currency,
          initialBalance: account.initialBalance,
          currentBalance: account.currentBalance,
        });
      },
      error: () => this.router.navigate(['/trading-accounts']),
    });
  }

  private submitCreate(): void {
    const value = this.form.getRawValue();
    const request: CreateTradingAccountRequest = {
      name:           value.name!.trim(),
      accountType:    value.accountType!,
      broker:         value.broker!.trim(),
      currency:       value.currency!.toUpperCase(),
      initialBalance: Number(value.initialBalance),
      ...(this.showCurrentBalance() && value.currentBalance != null
        ? { currentBalance: Number(value.currentBalance) }
        : {}),
    };

    this.service.create(request).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.toastService.success('TRADING_ACCOUNTS.CREATE_SUCCESS');
        this.router.navigate(['/trading-accounts']);
      },
    });
  }

  private submitUpdate(): void {
    const value = this.form.getRawValue();
    const request: UpdateTradingAccountRequest = {
      name:           value.name!.trim(),
      accountType:    value.accountType!,
      broker:         value.broker!.trim(),
      currency:       value.currency!.toUpperCase(),
      initialBalance: Number(value.initialBalance),
      currentBalance: Number(value.currentBalance),
    };

    this.service.update(this.accountId!, request).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.toastService.success('TRADING_ACCOUNTS.UPDATE_SUCCESS');
        this.router.navigate(['/trading-accounts']);
      },
    });
  }
}
