import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

import {
  AppBadgeComponent,
  AppButtonComponent,
  AppCardComponent,
  AppEmptyStateComponent,
  AppLoadingStateComponent,
  AppMetricCardComponent,
  AppPageHeaderComponent,
  AppProfitLossBadgeComponent,
  AppRiskRewardBadgeComponent,
  AppStatCardComponent,
  AppTableAction,
  AppTableActionEvent,
  AppTableColumn,
  AppTableComponent
} from '../../shared/components';
import { DashboardPeriod, DashboardRecentTrade, DashboardSummary } from './models/dashboard-summary.model';
import { DashboardService } from './services/dashboard.service';

interface TradeRow extends Record<string, unknown> {
  id: string;
  symbol: string;
  strategy: string;
  side: string;
  pnl: number;
  rr: number;
  status: string;
  session: string;
}

const EMPTY_SUMMARY: DashboardSummary = {
  totalTrades: 0, totalPnl: 0, totalR: 0, winRate: 0, averageR: 0,
  averageWin: 0, averageLoss: 0, bestStrategy: null, bestSession: null,
  rCurve: [], recentTrades: [], topStrategies: [], insights: []
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TranslatePipe, AppBadgeComponent, AppButtonComponent, AppCardComponent, AppEmptyStateComponent,
    AppLoadingStateComponent, AppMetricCardComponent, AppPageHeaderComponent,
    AppProfitLossBadgeComponent, AppRiskRewardBadgeComponent, AppStatCardComponent,
    AppTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly period = signal<DashboardPeriod>('ThisMonth');
  readonly summary = signal<DashboardSummary>(EMPTY_SUMMARY);
  readonly isLoading = signal(false);
  readonly hasData = computed(() => this.summary().totalTrades > 0);
  readonly periodLabelKey = computed(() => `DASHBOARD.PERIODS.${this.period().toUpperCase()}`);

  readonly statCards = computed(() => {
    const summary = this.summary();
    return [
      { label: 'DASHBOARD.STATS.NET_PNL', value: this.formatCurrency(summary.totalPnl), helper: 'DASHBOARD.STATS.PERIOD_TOTAL', trend: this.formatSigned(summary.totalPnl), tone: summary.totalPnl >= 0 ? 'positive' as const : 'negative' as const, icon: 'trending_up' },
      { label: 'DASHBOARD.STATS.WIN_RATE', value: this.formatPercent(summary.winRate), helper: this.tradeCountLabel(summary.totalTrades), trend: '', tone: 'positive' as const, icon: 'target' },
      { label: 'DASHBOARD.STATS.AVG_R', value: this.formatR(summary.averageR), helper: 'DASHBOARD.STATS.AVG_R_HELPER', trend: '', tone: 'neutral' as const, icon: 'balance' },
      { label: 'DASHBOARD.STATS.TOTAL_R', value: this.formatR(summary.totalR), helper: 'DASHBOARD.STATS.TOTAL_R_HELPER', trend: this.formatSigned(summary.totalR), tone: summary.totalR >= 0 ? 'positive' as const : 'negative' as const, icon: 'insights' }
    ];
  });

  readonly tradeColumns: AppTableColumn<TradeRow>[] = [
    { key: 'symbol', label: 'Symbol' }, { key: 'strategy', label: 'Strategy' },
    { key: 'side', label: 'Side', type: 'badge', badgeVariant: row => row.side === 'Long' ? 'success' : 'brand' },
    { key: 'pnl', label: 'P/L', type: 'profitLoss', align: 'right' },
    { key: 'rr', label: 'R:R', type: 'riskReward', align: 'center' },
    { key: 'status', label: 'Status', type: 'badge', badgeVariant: row => row.status === 'Closed' ? 'success' : 'warning' },
    { key: 'session', label: 'Session' }
  ];
  readonly tableActions: AppTableAction<TradeRow>[] = [{ id: 'edit', label: 'Edit trade', icon: 'edit' }];
  readonly tradeRows = computed<TradeRow[]>(() => this.summary().recentTrades.map(trade => this.toTradeRow(trade)));
  readonly rCurveBars = computed(() => {
    const values = this.summary().rCurve.map(point => point.value);
    const maximum = Math.max(...values.map(Math.abs), 1);
    return this.summary().rCurve.map(point => ({ ...point, height: `${Math.max(8, Math.round(Math.abs(point.value) / maximum * 100))}%`, negative: point.value < 0 }));
  });

  constructor() { this.load(); }

  cyclePeriod(): void {
    const periods: DashboardPeriod[] = ['ThisMonth', 'LastMonth', 'AllTime'];
    this.period.set(periods[(periods.indexOf(this.period()) + 1) % periods.length]);
    this.load();
  }

  onLogTrade(): void { this.router.navigate(['/trades/create']); }
  onOpenTrades(): void { this.router.navigate(['/trades']); }
  onRowAction(event: AppTableActionEvent<TradeRow>): void { this.router.navigate(['/trades', event.row.id, 'edit']); }

  private load(): void {
    this.isLoading.set(true);
    this.dashboardService.getTradingSummary({ period: this.period() }).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: summary => this.summary.set(this.normalizeSummary(summary)),
      error: () => this.summary.set(EMPTY_SUMMARY)
    });
  }

  private normalizeSummary(summary: Partial<DashboardSummary> | null | undefined): DashboardSummary {
    if (!summary) return EMPTY_SUMMARY;
    return {
      totalTrades: summary.totalTrades ?? 0,
      totalPnl: summary.totalPnl ?? 0,
      totalR: summary.totalR ?? 0,
      winRate: summary.winRate ?? 0,
      averageR: summary.averageR ?? 0,
      averageWin: summary.averageWin ?? 0,
      averageLoss: summary.averageLoss ?? 0,
      bestStrategy: summary.bestStrategy ?? null,
      bestSession: summary.bestSession ?? null,
      rCurve: summary.rCurve ?? [],
      recentTrades: summary.recentTrades ?? [],
      topStrategies: summary.topStrategies ?? [],
      insights: summary.insights ?? []
    };
  }

  private toTradeRow(trade: DashboardRecentTrade): TradeRow {
    return { id: trade.id, symbol: trade.symbol, strategy: trade.strategyName, side: trade.direction, pnl: trade.pnl ?? 0, rr: trade.rMultiple ?? 0, status: trade.status, session: trade.session };
  }
  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value ?? 0);
  }
  formatPercent(value: number | null | undefined): string { return `${(value ?? 0).toFixed(1)}%`; }
  formatR(value: number | null | undefined): string { return `${(value ?? 0).toFixed(2)}R`; }
  private formatSigned(value: number | null | undefined): string {
    const v = value ?? 0;
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}`;
  }
  private tradeCountLabel(count: number): string { return `${count} trade${count === 1 ? '' : 's'}`; }
}
