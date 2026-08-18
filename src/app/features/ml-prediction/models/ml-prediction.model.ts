import type { TradeDirection, TradingSession } from '../../trades/models/trade.model';

export interface MlReadinessResponse {
  isReady: boolean;
  reason?: string | null;
  closedTradeCount: number;
  minimumRequired: number;
}

export interface MlTrainResponse {
  modelVersion: string;
  sampleCount: number;
  positiveCount: number;
  nonPositiveCount: number;
  trainedAt: string;
}

export interface MlScoreRuleCheck {
  strategyRuleId: string;
  isFollowed: boolean;
}

export interface MlScoreRequest {
  strategyId: string;
  tradingInstrumentId: string;
  direction: TradeDirection;
  session?: TradingSession | null;
  tradeDate: string;
  stopLoss?: number | null;
  takeProfit?: number | null;
  riskAmount?: number | null;
  ruleChecks: MlScoreRuleCheck[];
}

export type MlConfidence = 'Low' | 'Medium' | 'High';

export interface MlScoreResponse {
  positiveOutcomeProbability: number;
  confidence: MlConfidence;
  sampleCount: number;
  message?: string | null;
  disclaimer?: string | null;
}
