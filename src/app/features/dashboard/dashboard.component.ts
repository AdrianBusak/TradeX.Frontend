import { Component } from '@angular/core';
import {
  AppBadgeComponent,
  AppButtonComponent,
  AppCardComponent,
  AppMetricCardComponent,
  AppPageHeaderComponent,
  AppProfitLossBadgeComponent,
  AppRiskRewardBadgeComponent,
  AppStatCardComponent,
  AppTableAction,
  AppTableColumn,
  AppTableComponent
} from '../../shared/components';

interface TradeRow extends Record<string, unknown> {
  id: number;
  symbol: string;
  setup: string;
  side: string;
  pnl: number;
  rr: number;
  status: string;
  session: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AppBadgeComponent,
    AppButtonComponent,
    AppCardComponent,
    AppMetricCardComponent,
    AppPageHeaderComponent,
    AppProfitLossBadgeComponent,
    AppRiskRewardBadgeComponent,
    AppStatCardComponent,
    AppTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  readonly statCards = [
    { label: 'Net P/L', value: '$18,420', helper: 'Last 30 days', trend: '+12.4%', tone: 'positive' as const, icon: 'trending_up' },
    { label: 'Win Rate', value: '62.8%', helper: '42 closed trades', trend: '+4.1%', tone: 'positive' as const, icon: 'target' },
    { label: 'Avg R:R', value: '2.1R', helper: 'Best setup: Breakout', trend: '+0.3R', tone: 'neutral' as const, icon: 'balance' },
    { label: 'Max Drawdown', value: '4.7%', helper: 'Risk limit 7%', trend: '-1.2%', tone: 'warning' as const, icon: 'waterfall_chart' }
  ];

  readonly tradeColumns: AppTableColumn<TradeRow>[] = [
    { key: 'symbol', label: 'Symbol' },
    { key: 'setup', label: 'Setup' },
    { key: 'side', label: 'Side', type: 'badge', badgeVariant: row => row.side === 'Long' ? 'success' : 'brand' },
    { key: 'pnl', label: 'P/L', type: 'profitLoss', align: 'right' },
    { key: 'rr', label: 'R:R', type: 'riskReward', align: 'center' },
    { key: 'status', label: 'Status', type: 'badge', badgeVariant: row => row.status === 'Reviewed' ? 'success' : 'warning' },
    { key: 'session', label: 'Session' }
  ];

  readonly tradeRows: TradeRow[] = [
    { id: 1, symbol: 'NQ', setup: 'Opening range breakout', side: 'Long', pnl: 1840, rr: 2.8, status: 'Reviewed', session: 'New York' },
    { id: 2, symbol: 'ES', setup: 'VWAP reclaim', side: 'Short', pnl: -520, rr: 0.7, status: 'Needs note', session: 'New York' },
    { id: 3, symbol: 'AAPL', setup: 'Trend pullback', side: 'Long', pnl: 960, rr: 1.9, status: 'Reviewed', session: 'US Open' },
    { id: 4, symbol: 'EURUSD', setup: 'Liquidity sweep', side: 'Short', pnl: 430, rr: 1.4, status: 'Reviewed', session: 'London' }
  ];

  readonly tableActions: AppTableAction<TradeRow>[] = [
    { id: 'view', label: 'View trade', icon: 'visibility' },
    { id: 'edit', label: 'Edit trade', icon: 'edit' }
  ];

  readonly strategies = [
    { name: 'Opening Range Breakout', trades: 14, pnl: 8200, winRate: '71%' },
    { name: 'VWAP Reclaim', trades: 11, pnl: 3950, winRate: '64%' },
    { name: 'Liquidity Sweep', trades: 9, pnl: 2280, winRate: '56%' }
  ];

  readonly riskRules = [
    { label: 'Daily loss limit', value: '42% used', tone: 'brand' as const },
    { label: 'Trades over plan risk', value: '1 trade', tone: 'warning' as const },
    { label: 'Rule compliance', value: '93%', tone: 'positive' as const }
  ];
}
