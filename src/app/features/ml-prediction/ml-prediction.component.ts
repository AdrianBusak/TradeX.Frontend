import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import {
  AppBadgeComponent,
  AppButtonComponent,
  AppCardComponent,
  AppInputComponent,
  AppLoadingStateComponent,
  AppPageHeaderComponent,
  AppSelectComponent,
  AppSelectOption,
} from '../../shared/components';
import { DateFieldComponent } from '../../shared/components/form-fields/date-field/date-field.component';

import { ToastService } from '../../core/services/toast.service';
import { QueryBuilder } from '../../core/utils/query-builder';

import { StrategyService } from '../strategies/services/strategy.service';
import { StrategyRuleService } from '../strategies/services/strategy-rule.service';
import { StrategyRule } from '../strategies/models/strategy.model';
import { TradingInstrumentService } from '../trades/services/trading-instrument.service';
import {
  TRADE_DIRECTIONS,
  TRADING_SESSIONS,
  TradeDirection,
  TradingSession,
} from '../trades/models/trade.model';

import { MlPredictionService } from './services/ml-prediction.service';
import {
  MlReadinessResponse,
  MlScoreRequest,
  MlScoreResponse,
  MlTrainResponse,
} from './models/ml-prediction.model';

interface RuleCheckState {
  rule: StrategyRule;
  isFollowed: boolean;
}

@Component({
  selector: 'app-ml-prediction',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    DatePipe,
    DecimalPipe,
    AppBadgeComponent,
    AppButtonComponent,
    AppCardComponent,
    AppInputComponent,
    AppLoadingStateComponent,
    AppPageHeaderComponent,
    AppSelectComponent,
    DateFieldComponent,
  ],
  templateUrl: './ml-prediction.component.html',
  styleUrl: './ml-prediction.component.scss',
})
export class MlPredictionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mlService = inject(MlPredictionService);
  private readonly strategyService = inject(StrategyService);
  private readonly strategyRuleService = inject(StrategyRuleService);
  private readonly instrumentService = inject(TradingInstrumentService);

  readonly readiness = signal<MlReadinessResponse | null>(null);
  readonly isLoadingReadiness = signal(false);
  readonly isTraining = signal(false);
  readonly lastTraining = signal<MlTrainResponse | null>(null);

  readonly isScoring = signal(false);
  readonly score = signal<MlScoreResponse | null>(null);
  readonly scoreError = signal('');

  readonly strategyOptions = signal<AppSelectOption[]>([]);
  readonly instrumentOptions = signal<AppSelectOption[]>([]);
  readonly ruleChecks = signal<RuleCheckState[]>([]);
  readonly isLoadingRules = signal(false);

  submitted = false;

  readonly directionOptions: AppSelectOption[] = TRADE_DIRECTIONS.map(value => ({
    value,
    label: this.translate.instant(`TRADES.DIRECTIONS.${value.toUpperCase()}`),
  }));

  readonly sessionOptions: AppSelectOption[] = TRADING_SESSIONS.map(value => ({
    value,
    label: this.translate.instant(`TRADES.SESSIONS.${this.enumKey(value)}`),
  }));

  readonly form = this.fb.group({
    strategyId: [null as string | null, Validators.required],
    tradingInstrumentId: [null as string | null, Validators.required],
    direction: [null as TradeDirection | null, Validators.required],
    session: [null as TradingSession | null],
    tradeDate: [null as string | null, Validators.required],
    stopLoss: [null as number | null, [Validators.required, Validators.min(Number.EPSILON)]],
    takeProfit: [null as number | null, [Validators.required, Validators.min(Number.EPSILON)]],
    riskAmount: [null as number | null, Validators.min(0)],
  });

  readonly plannedRr = computed(() => {
    const stop = this.form.controls.stopLoss.value;
    const take = this.form.controls.takeProfit.value;
    if (!stop || !take || stop <= 0) return null;
    return take / stop;
  });

  readonly probabilityPercent = computed(() => {
    const s = this.score();
    return s ? Math.round(s.positiveOutcomeProbability * 1000) / 10 : 0;
  });

  readonly confidenceVariant = computed<'success' | 'warning' | 'danger' | 'neutral'>(() => {
    const s = this.score();
    if (!s) return 'neutral';
    switch (s.confidence) {
      case 'High': return 'success';
      case 'Medium': return 'warning';
      case 'Low': return 'danger';
      default: return 'neutral';
    }
  });

  readonly readinessProgress = computed(() => {
    const r = this.readiness();
    if (!r || r.minimumRequired <= 0) return 0;
    return Math.min(100, Math.round((r.closedTradeCount / r.minimumRequired) * 100));
  });

  constructor() {
    this.loadReadiness();
    this.loadLookups();

    this.form.controls.strategyId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => this.loadRules(id));

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.score.set(null);
        this.scoreError.set('');
      });
  }

  onRefreshReadiness(): void {
    this.loadReadiness();
  }

  onTrain(): void {
    if (this.isTraining()) return;
    this.isTraining.set(true);
    this.mlService.train()
      .pipe(
        finalize(() => this.isTraining.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          this.lastTraining.set(response);
          this.toast.success('ML_PREDICTION.TOAST.TRAIN_SUCCESS');
          this.loadReadiness();
        },
        error: error => this.toast.error(this.readError(error, 'ML_PREDICTION.ERRORS.TRAIN_FAILED')),
      });
  }

  toggleRuleFollowed(strategyRuleId: string, isFollowed: boolean): void {
    this.ruleChecks.update(list =>
      list.map(item => item.rule.id === strategyRuleId ? { ...item, isFollowed } : item),
    );
    this.score.set(null);
    this.scoreError.set('');
  }

  onScore(): void {
    this.submitted = true;
    if (this.form.invalid || !this.readiness()?.isReady) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.buildScoreRequest();
    if (!request) return;

    this.isScoring.set(true);
    this.scoreError.set('');
    this.mlService.score(request)
      .pipe(
        finalize(() => this.isScoring.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => this.score.set(response),
        error: error => this.scoreError.set(this.readError(error, 'ML_PREDICTION.ERRORS.SCORE_FAILED')),
      });
  }

  fieldError(control: FormControl): string {
    if (!control || (!control.touched && !this.submitted)) return '';
    if (control.hasError('required')) return this.translate.instant('ERRORS.REQUIRED');
    if (control.hasError('min')) return this.translate.instant('ERRORS.MIN_VALUE');
    return '';
  }

  controlOf(name: 'strategyId' | 'tradingInstrumentId' | 'direction' | 'session' | 'tradeDate' | 'stopLoss' | 'takeProfit' | 'riskAmount'): FormControl {
    return this.form.controls[name] as FormControl;
  }

  private loadReadiness(): void {
    this.isLoadingReadiness.set(true);
    this.mlService.getReadiness()
      .pipe(
        finalize(() => this.isLoadingReadiness.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => this.readiness.set(response),
        error: () => this.readiness.set(null),
      });
  }

  private loadLookups(): void {
    forkJoin({
      strategies: this.strategyService.getAll(new QueryBuilder().setPage(0, 500)),
      instruments: this.instrumentService.getLookup(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ strategies, instruments }) => {
          this.strategyOptions.set(
            (strategies.model ?? [])
              .filter(s => s.isActive)
              .map(s => ({ value: s.id, label: s.name })),
          );
          this.instrumentOptions.set(
            (instruments.model ?? [])
              .filter(i => i.isActive)
              .map(i => ({ value: i.id, label: i.display })),
          );
        },
      });
  }

  private loadRules(strategyId: string | null): void {
    if (!strategyId) {
      this.ruleChecks.set([]);
      return;
    }
    this.isLoadingRules.set(true);
    this.strategyRuleService.getAll(strategyId, new QueryBuilder().setPage(0, 500))
      .pipe(
        finalize(() => this.isLoadingRules.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          const rules = (response.model ?? [])
            .filter(rule => rule.isActive)
            .sort((a, b) => a.order - b.order);
          this.ruleChecks.set(rules.map(rule => ({ rule, isFollowed: false })));
        },
        error: () => this.ruleChecks.set([]),
      });
  }

  private buildScoreRequest(): MlScoreRequest | null {
    const value = this.form.getRawValue();
    if (!value.strategyId || !value.tradingInstrumentId || !value.direction || !value.tradeDate) {
      return null;
    }

    return {
      strategyId: value.strategyId,
      tradingInstrumentId: value.tradingInstrumentId,
      direction: value.direction,
      session: value.session,
      tradeDate: this.toIsoDate(value.tradeDate),
      stopLoss: value.stopLoss ?? null,
      takeProfit: value.takeProfit ?? null,
      riskAmount: value.riskAmount ?? null,
      ruleChecks: this.ruleChecks().map(item => ({
        strategyRuleId: item.rule.id,
        isFollowed: item.isFollowed,
      })),
    };
  }

  private toIsoDate(value: string): string {
    if (!value) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }

  private enumKey(value: string): string {
    return value.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  }

  private readError(error: unknown, fallbackKey: string): string {
    if (error instanceof Error && error.message) return error.message;
    return this.translate.instant(fallbackKey);
  }
}
