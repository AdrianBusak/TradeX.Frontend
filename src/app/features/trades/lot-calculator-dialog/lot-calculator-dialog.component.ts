import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { DialogLayoutComponent } from '../../../shared/components/layout/dialog-layout/dialog-layout.component';
import { AppInputComponent } from '../../../shared/components/app-input/app-input.component';
import { AppSelectComponent, AppSelectOption } from '../../../shared/components/app-select/app-select.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { ToastService } from '../../../core/services/toast.service';
import { TradingAccountService } from '../../trading-accounts/services/trading-account.service';
import { TradingInstrumentService } from '../services/trading-instrument.service';
import { LotCalculatorService } from '../services/lot-calculator.service';
import { CalculateLotRequest, CalculateLotResponse } from '../models/lot-calculator.model';
import { MarketType } from '../../strategies/models/strategy.model';

export interface LotCalculatorDialogData {
  tradingAccountId?: string | null;
  tradingInstrumentId?: string | null;
  entryPrice?: number | null;
  stopLossPrice?: number | null;
}

@Component({
  selector: 'app-lot-calculator-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe, DecimalPipe, DialogLayoutComponent, AppInputComponent, AppSelectComponent, AppButtonComponent],
  templateUrl: './lot-calculator-dialog.component.html',
  styleUrl: './lot-calculator-dialog.component.scss',
})
export class LotCalculatorDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(TradingAccountService);
  private readonly instrumentService = inject(TradingInstrumentService);
  private readonly calculatorService = inject(LotCalculatorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<LotCalculatorDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogData = inject<LotCalculatorDialogData>(MAT_DIALOG_DATA);

  readonly isCalculating = signal(false);
  readonly result = signal<CalculateLotResponse | null>(null);
  readonly calculationError = signal('');
  readonly accountOptions = signal<AppSelectOption[]>([]);
  readonly instrumentOptions = signal<AppSelectOption[]>([]);
  submitted = false;

  readonly marketTypeOptions: AppSelectOption[] = ['Forex', 'Indices'].map(value => ({
    value,
    label: this.translate.instant(`STRATEGIES.MARKET_TYPES.${value.toUpperCase()}`),
  }));

  readonly form = this.fb.group({
    tradingAccountId: [this.dialogData.tradingAccountId ?? null as string | null],
    accountCurrency: ['', [Validators.minLength(3), Validators.maxLength(3)]],
    accountBalance: [null as number | null, Validators.min(Number.EPSILON)],
    riskPercent: [null as number | null, [Validators.required, Validators.min(Number.EPSILON)]],
    tradingInstrumentId: [this.dialogData.tradingInstrumentId ?? null as string | null],
    symbol: ['', Validators.maxLength(20)],
    marketType: [null as MarketType | null],
    entryPrice: [this.dialogData.entryPrice ?? null as number | null, Validators.min(Number.EPSILON)],
    stopLossPrice: [this.dialogData.stopLossPrice ?? null as number | null, Validators.min(Number.EPSILON)],
    stopLossPips: [null as number | null, Validators.min(Number.EPSILON)],
  });

  constructor() {
    this.loadLookups();
    this.form.get('tradingAccountId')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.syncManualAccountFields());
    this.form.get('tradingInstrumentId')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.syncManualInstrumentFields());
    this.form.get('accountCurrency')!.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
      if (value && value !== value.toUpperCase()) this.form.get('accountCurrency')!.setValue(value.toUpperCase(), { emitEvent: false });
    });
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.result.set(null);
      this.calculationError.set('');
    });
    this.syncManualAccountFields();
    this.syncManualInstrumentFields();
  }

  get usingSavedAccount(): boolean { return !!this.form.get('tradingAccountId')!.value; }
  get usingSavedInstrument(): boolean { return !!this.form.get('tradingInstrumentId')!.value; }

  fieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || (!control.touched && !this.submitted)) return '';
    if (control.hasError('required')) return this.translate.instant('ERRORS.REQUIRED');
    if (control.hasError('min')) return this.translate.instant('TRADES.VALIDATION.POSITIVE_VALUE');
    if (control.hasError('minlength') || control.hasError('maxlength')) return this.translate.instant('LOT_CALCULATOR.ERRORS.CURRENCY_LENGTH');
    return '';
  }

  onCalculate(): void {
    this.submitted = true;
    const request = this.buildRequest();
    if (!request || this.form.invalid) {
      this.form.markAllAsTouched();
      if (!request) this.calculationError.set(this.translate.instant('LOT_CALCULATOR.ERRORS.COMPLETE_INPUTS'));
      return;
    }

    this.isCalculating.set(true);
    this.calculationError.set('');
    this.calculatorService.calculate(request).pipe(finalize(() => this.isCalculating.set(false))).subscribe({
      next: response => this.result.set(response),
      error: error => this.calculationError.set(this.readError(error)),
    });
  }

  onUseLot(): void {
    const response = this.result();
    if (!response) return;
    const lotText = String(response.roundedLotSize);
    const notify = () => this.toast.success('LOT_CALCULATOR.COPIED', { lot: lotText });
    const fallbackCopy = (): boolean => {
      const textarea = document.createElement('textarea');
      textarea.value = lotText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(lotText).then(notify).catch(() => { if (fallbackCopy()) notify(); });
    } else if (fallbackCopy()) {
      notify();
    }
  }

  onCancel(): void { this.dialogRef.close(null); }

  private loadLookups(): void {
    this.accountService.getLookup().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => this.accountOptions.set((response.model ?? []).filter(a => a.isActive).map(a => ({ value: a.id, label: a.display }))),
    });
    this.instrumentService.getLookup().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => this.instrumentOptions.set((response.model ?? []).filter(i => i.isActive).map(i => ({ value: i.id, label: i.display }))),
    });
  }

  private syncManualAccountFields(): void {
    const fields = ['accountCurrency', 'accountBalance'];
    fields.forEach(name => this.usingSavedAccount ? this.form.get(name)!.disable({ emitEvent: false }) : this.form.get(name)!.enable({ emitEvent: false }));
  }

  private syncManualInstrumentFields(): void {
    ['symbol', 'marketType'].forEach(name => this.usingSavedInstrument ? this.form.get(name)!.disable({ emitEvent: false }) : this.form.get(name)!.enable({ emitEvent: false }));
  }

  private buildRequest(): CalculateLotRequest | null {
    const value = this.form.getRawValue();
    const accountId = value.tradingAccountId || null;
    const instrumentId = value.tradingInstrumentId || null;
    const manualCurrency = value.accountCurrency?.trim().toUpperCase() || null;
    const manualBalance = this.number(value.accountBalance);
    const symbol = value.symbol?.trim().toUpperCase() || null;
    const stopLossPips = this.number(value.stopLossPips);
    const entryPrice = this.number(value.entryPrice);
    const stopLossPrice = this.number(value.stopLossPrice);

    const isValid = !!this.number(value.riskPercent)
      && (accountId || (manualCurrency?.length === 3 && !!manualBalance))
      && (instrumentId || (symbol && value.marketType))
      && (!!stopLossPips || (entryPrice && stopLossPrice));

    return isValid ? {
      tradingAccountId: accountId,
      accountCurrency: accountId ? null : manualCurrency,
      accountBalance: accountId ? null : manualBalance,
      riskPercent: this.number(value.riskPercent)!,
      tradingInstrumentId: instrumentId,
      symbol: instrumentId ? null : symbol,
      marketType: instrumentId ? null : value.marketType,
      entryPrice,
      stopLossPrice,
      stopLossPips,
    } : null;
  }

  private number(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private readError(error: unknown): string {
    return error instanceof Error && error.message ? error.message : this.translate.instant('ERRORS.BAD_REQUEST');
  }
}
