import type { MarketType } from '../../strategies/models/strategy.model';

export interface CalculateLotRequest {
  tradingAccountId?: string | null;
  accountCurrency?: string | null;
  accountBalance?: number | null;
  riskPercent: number;
  tradingInstrumentId?: string | null;
  symbol?: string | null;
  marketType?: MarketType | null;
  entryPrice?: number | null;
  stopLossPrice?: number | null;
  stopLossPips?: number | null;
}

export interface CalculateLotResponse {
  symbol: string;
  marketType: MarketType;
  accountCurrency: string;
  accountBalance: number;
  riskPercent: number;
  riskAmount: number;
  stopLossPips: number;
  pipSize: number;
  contractSize: number;
  pipValuePerLot: number;
  lotSize: number;
  roundedLotSize: number;
  estimatedLoss: number;
  warning?: string | null;
}
