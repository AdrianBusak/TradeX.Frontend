import type { MarketType } from '../../strategies/models/strategy.model';

export interface TradingInstrumentLookup {
  id: string;
  display: string;
  symbol: string;
  marketType: MarketType;
  isActive: boolean;
}

export interface CreateTradingInstrumentRequest {
  symbol: string;
  marketType: MarketType;
}

export interface UpdateTradingInstrumentRequest {
  symbol: string;
  marketType: MarketType;
}
