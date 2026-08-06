export type DashboardPeriod = 'ThisMonth' | 'LastMonth' | 'AllTime';

export interface DashboardStrategySummary {
  strategyId: string;
  strategyName: string;
  tradeCount: number;
  totalPnl: number;
  totalR: number;
  winRate: number;
  averageR: number;
}

export interface DashboardSessionSummary {
  session: string;
  tradeCount: number;
  totalPnl: number;
  totalR: number;
  winRate: number;
  averageR: number;
}

export interface DashboardRCurvePoint {
  date: string;
  value: number;
}

export interface DashboardRecentTrade {
  id: string;
  symbol: string;
  strategyName: string;
  direction: string;
  session: string;
  status: string;
  tradeDate: string;
  pnl: number | null;
  rMultiple: number | null;
}

export interface DashboardSummary {
  totalTrades: number;
  totalPnl: number;
  totalR: number;
  winRate: number;
  averageR: number;
  averageWin: number;
  averageLoss: number;
  bestStrategy: DashboardStrategySummary | null;
  bestSession: DashboardSessionSummary | null;
  rCurve: DashboardRCurvePoint[];
  recentTrades: DashboardRecentTrade[];
  topStrategies: DashboardStrategySummary[];
  insights: string[];
}

export interface DashboardSummaryQuery {
  period?: DashboardPeriod;
  dateFrom?: string;
  dateTo?: string;
  strategyId?: string;
  accountId?: string;
}
