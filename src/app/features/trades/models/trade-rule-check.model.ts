export interface TradeRuleChecksResponse {
  tradeId: string;
  strategyId: string;
  complianceScore?: number | null;
  totalRules: number;
  checkedRules: number;
  followedRules: number;
  brokenRules: number;
  rules: TradeRuleCheckItem[];
}

export interface TradeRuleCheckItem {
  strategyRuleId: string;
  title: string;
  description?: string | null;
  order: number;
  isRequired: boolean;
  isFollowed?: boolean | null;
  note?: string | null;
}

export interface UpdateTradeRuleChecksRequest {
  rules: UpdateTradeRuleCheckItemRequest[];
}

export interface UpdateTradeRuleCheckItemRequest {
  strategyRuleId: string;
  isFollowed: boolean;
  note?: string | null;
}
