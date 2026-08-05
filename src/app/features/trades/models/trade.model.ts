import type { MarketType } from '../../strategies/models/strategy.model';

export type { MarketType };

export type TradeDirection = 'Long' | 'Short';
export type TradeStatus = 'Planned' | 'Open' | 'Closed' | 'Cancelled' | 'BreakEven';
export type TradingSession = 'Asia' | 'London' | 'NewYork' | 'LondonNewYorkOverlap' | 'Other';

export const TRADE_DIRECTIONS: TradeDirection[] = ['Long', 'Short'];
export const TRADE_STATUSES: TradeStatus[] = ['Planned', 'Open', 'Closed', 'Cancelled', 'BreakEven'];
export const TRADING_SESSIONS: TradingSession[] = ['Asia', 'London', 'NewYork', 'LondonNewYorkOverlap', 'Other'];

export interface TradeAccountSummary {
  id: string;
  name: string;
}

export interface TradeListItem {
  id: string;
  strategyId: string;
  strategyName: string;
  tradingInstrumentId: string;
  symbol: string;
  marketType: MarketType;
  tradingAccounts: TradeAccountSummary[];
  direction: TradeDirection;
  session?: TradingSession | null;
  status: TradeStatus;
  tradeDate: string;
  entryPrice?: number | null;
  exitPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  lotSize?: number | null;
  riskAmount?: number | null;
  pnl?: number | null;
  rMultiple?: number | null;
  notes?: string | null;
  isActive: boolean;
}

export interface TradeDetails extends TradeListItem {
  tradingAccountIds: string[];
}

export interface CreateTradeRequest {
  strategyId: string;
  tradingInstrumentId: string;
  tradingAccountIds: string[];
  direction: TradeDirection;
  session?: TradingSession | null;
  status: TradeStatus;
  tradeDate: string;
  entryPrice?: number | null;
  exitPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  lotSize?: number | null;
  riskAmount?: number | null;
  pnl?: number | null;
  rMultiple?: number | null;
  notes?: string | null;
}

export type UpdateTradeRequest = CreateTradeRequest;
