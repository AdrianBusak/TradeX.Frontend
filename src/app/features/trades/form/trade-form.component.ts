import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { DateFieldComponent } from '../../../shared/components/form-fields/date-field/date-field.component';
import { TradeService } from '../services/trade.service';
import { TradingInstrumentService } from '../services/trading-instrument.service';
import { StrategyService } from '../../strategies/services/strategy.service';
import { TradingAccountService } from '../../trading-accounts/services/trading-account.service';
import {
  CreateTradeRequest,
  TRADE_DIRECTIONS,
  TRADE_STATUSES,
  TRADING_SESSIONS,
  TradeDetails,
  TradeDirection,
  TradeStatus,
  TradingSession,
  UpdateTradeRequest,
} from '../models/trade.model';
import {
  TradingInstrumentDialogComponent,
} from '../instrument-dialog/trading-instrument-dialog.component';

@Component({
  selector: 'app-trade-form',
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
    DateFieldComponent,
  ],
  templateUrl: './trade-form.component.html',
  styleUrl: './trade-form.component.scss',
})
export class TradeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tradeService = inject(TradeService);
  private readonly instrumentService = inject(TradingInstrumentService);
  private readonly strategyService = inject(StrategyService);
  private readonly accountService = inject(TradingAccountService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  isEditMode = false;
  tradeId: string | null = null;
  submitted = false;

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly strategyOptions = signal<AppSelectOption[]>([]);
  readonly instrumentOptions = signal<AppSelectOption[]>([]);
  readonly accountOptions = signal<{ id: string; label: string }[]>([]);
  readonly rMultiplePreview = signal('—');
  readonly priceWarningKey = signal('');

  readonly directionOptions: AppSelectOption[] = TRADE_DIRECTIONS.map(d => ({
    label: this.translate.instant(`TRADES.DIRECTIONS.${d.toUpperCase()}`),
    value: d,
  }));

  readonly statusOptions: AppSelectOption[] = TRADE_STATUSES.map(s => ({
    label: this.translate.instant(`TRADES.STATUSES.${this.enumKey(s)}`),
    value: s,
  }));

  readonly sessionOptions: AppSelectOption[] = TRADING_SESSIONS.map(s => ({
    label: this.translate.instant(`TRADES.SESSIONS.${this.enumKey(s)}`),
    value: s,
  }));

  readonly form = this.fb.group({
    tradingInstrumentId: [null as string | null, Validators.required],
    strategyId: [null as string | null, Validators.required],
    tradingAccountIds: [[] as string[], Validators.required],
    direction: [null as TradeDirection | null, Validators.required],
    session: [null as TradingSession | null],
    status: ['Planned' as TradeStatus, Validators.required],
    tradeDate: [null as string | null, Validators.required],
    entryPrice: [null as number | null, Validators.min(Number.EPSILON)],
    exitPrice: [null as number | null, Validators.min(Number.EPSILON)],
    stopLoss: [null as number | null, Validators.min(Number.EPSILON)],
    takeProfit: [null as number | null, Validators.min(Number.EPSILON)],
    lotSize: [null as number | null, Validators.min(Number.EPSILON)],
    riskAmount: [null as number | null, Validators.min(0)],
    pnl: [null as number | null],
    notes: [null as string | null, Validators.maxLength(4000)],
  });

  constructor() {
    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.updateDerivedState());
  }

  ngOnInit(): void {
    this.tradeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.tradeId;

    this.loadLookups();

    if (this.isEditMode) {
      this.loadTrade();
    }
  }

  isAccountSelected(accountId: string): boolean {
    return (this.form.get('tradingAccountIds')!.value as string[]).includes(accountId);
  }

  onAccountToggle(accountId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.get('tradingAccountIds')!.value as string[];
    const updated = checked
      ? [...current, accountId]
      : current.filter(id => id !== accountId);
    this.form.get('tradingAccountIds')!.setValue(updated);
    this.form.get('tradingAccountIds')!.markAsTouched();
  }

  onSave(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    if (this.isEditMode) {
      this.submitUpdate();
    } else {
      this.submitCreate();
    }
  }

  onBack(): void {
    this.router.navigate(['/trades']);
  }

  onCreateInstrument(): void {
    this.dialog.open(TradingInstrumentDialogComponent, { width: '480px' })
      .afterClosed()
      .subscribe((createdId: string | null) => {
        if (createdId) this.loadInstrumentLookup(createdId);
      });
  }

  fieldError(fieldName: string): string {
    const ctrl = this.form.get(fieldName);
    if (!ctrl || (!ctrl.touched && !this.submitted)) return '';
    if (ctrl.hasError('required')) return this.translate.instant('ERRORS.REQUIRED');
    if (ctrl.hasError('maxlength')) {
      const max = (ctrl.getError('maxlength') as { requiredLength: number }).requiredLength;
      return this.translate.instant('ERRORS.MAX_LENGTH', { max });
    }
    if (ctrl.hasError('min')) {
      const min = (ctrl.getError('min') as { min: number }).min;
      return this.translate.instant(min === 0 ? 'ERRORS.MIN_VALUE' : 'TRADES.VALIDATION.POSITIVE_VALUE');
    }
    return '';
  }

  private loadLookups(): void {
    this.strategyService.getAll(new QueryBuilder().setPage(0, 500)).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.strategyOptions.set(
          (res.model ?? [])
            .filter(s => s.isActive)
            .map(s => ({ label: s.name, value: s.id }))
        );
      },
    });

    this.loadInstrumentLookup();

    this.accountService.getLookup().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.accountOptions.set(
          (res.model ?? [])
            .filter(a => a.isActive)
            .map(a => ({ id: a.id, label: a.display }))
        );
      },
    });
  }

  private loadTrade(): void {
    this.isLoading.set(true);
    this.tradeService.getById(this.tradeId!).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (trade: TradeDetails) => {
        this.form.patchValue({
          tradingInstrumentId: trade.tradingInstrumentId,
          strategyId: trade.strategyId,
          tradingAccountIds: trade.tradingAccountIds ?? [],
          direction: trade.direction,
          session: trade.session,
          status: trade.status,
          tradeDate: this.toDateValue(trade.tradeDate),
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          lotSize: trade.lotSize,
          riskAmount: trade.riskAmount,
          pnl: trade.pnl,
          notes: trade.notes ?? null,
        });
      },
      error: () => this.router.navigate(['/trades']),
    });
  }

  private submitCreate(): void {
    const value = this.form.getRawValue();
    const request: CreateTradeRequest = {
      tradingInstrumentId: value.tradingInstrumentId!,
      strategyId: value.strategyId!,
      tradingAccountIds: value.tradingAccountIds ?? [],
      direction: value.direction!,
      session: value.session ?? null,
      status: value.status!,
      tradeDate: value.tradeDate!,
      entryPrice: this.coerceNumber(value.entryPrice),
      exitPrice: this.coerceNumber(value.exitPrice),
      stopLoss: this.coerceNumber(value.stopLoss),
      takeProfit: this.coerceNumber(value.takeProfit),
      lotSize: this.coerceNumber(value.lotSize),
      riskAmount: this.coerceNumber(value.riskAmount),
      pnl: this.coerceNumber(value.pnl),
      notes: value.notes?.trim() || null,
    };

    this.tradeService.create(request).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (res) => {
        this.toastService.success('TRADES.CREATE_SUCCESS');
        this.router.navigate(['/trades', res.id, 'edit']);
      },
    });
  }

  private submitUpdate(): void {
    const value = this.form.getRawValue();
    const request: UpdateTradeRequest = {
      tradingInstrumentId: value.tradingInstrumentId!,
      strategyId: value.strategyId!,
      tradingAccountIds: value.tradingAccountIds ?? [],
      direction: value.direction!,
      session: value.session ?? null,
      status: value.status!,
      tradeDate: value.tradeDate!,
      entryPrice: this.coerceNumber(value.entryPrice),
      exitPrice: this.coerceNumber(value.exitPrice),
      stopLoss: this.coerceNumber(value.stopLoss),
      takeProfit: this.coerceNumber(value.takeProfit),
      lotSize: this.coerceNumber(value.lotSize),
      riskAmount: this.coerceNumber(value.riskAmount),
      pnl: this.coerceNumber(value.pnl),
      notes: value.notes?.trim() || null,
    };

    this.tradeService.update(this.tradeId!, request).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => this.toastService.success('TRADES.UPDATE_SUCCESS'),
    });
  }

  private coerceNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  private loadInstrumentLookup(selectedId?: string): void {
    this.instrumentService.getLookup().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.instrumentOptions.set(
          (res.model ?? [])
            .filter(instrument => instrument.isActive)
            .map(instrument => ({ label: instrument.display, value: instrument.id }))
        );
        if (selectedId) this.form.get('tradingInstrumentId')!.setValue(selectedId);
      },
    });
  }

  private toDateValue(value: string | null | undefined): string | null {
    if (!value) return null;
    return value.slice(0, 10);
  }

  private updateDerivedState(): void {
    const value = this.form.getRawValue();
    const pnl = this.coerceNumber(value.pnl);
    const riskAmount = this.coerceNumber(value.riskAmount);
    this.rMultiplePreview.set(
      pnl !== null && riskAmount !== null && riskAmount > 0
        ? (pnl / riskAmount).toFixed(2)
        : '—'
    );

    const entryPrice = this.coerceNumber(value.entryPrice);
    const stopLoss = this.coerceNumber(value.stopLoss);
    const takeProfit = this.coerceNumber(value.takeProfit);
    const direction = value.direction;

    if (entryPrice === null || !direction) {
      this.priceWarningKey.set('');
    } else if (direction === 'Long' && stopLoss !== null && stopLoss >= entryPrice) {
      this.priceWarningKey.set('TRADES.VALIDATION.LONG_STOP_LOSS');
    } else if (direction === 'Long' && takeProfit !== null && takeProfit <= entryPrice) {
      this.priceWarningKey.set('TRADES.VALIDATION.LONG_TAKE_PROFIT');
    } else if (direction === 'Short' && stopLoss !== null && stopLoss <= entryPrice) {
      this.priceWarningKey.set('TRADES.VALIDATION.SHORT_STOP_LOSS');
    } else if (direction === 'Short' && takeProfit !== null && takeProfit >= entryPrice) {
      this.priceWarningKey.set('TRADES.VALIDATION.SHORT_TAKE_PROFIT');
    } else {
      this.priceWarningKey.set('');
    }
  }

  private enumKey(value: string): string {
    return value.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
  }
}
