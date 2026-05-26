export type MarketType = 'Forex' | 'Crypto' | 'Indices' | 'Stocks' | 'Metals' | 'Futures';
export type StrategyRuleCategory =
  | 'General'
  | 'MarketStructure'
  | 'Entry'
  | 'RiskManagement'
  | 'Exit'
  | 'Psychology'
  | 'News';
export type StrategyRuleImportance = 'Low' | 'Medium' | 'High' | 'Critical';

export const MARKET_TYPES: MarketType[] = [
  'Forex',
  'Crypto',
  'Indices',
  'Stocks',
  'Metals',
  'Futures',
];

export const STRATEGY_RULE_CATEGORIES: StrategyRuleCategory[] = [
  'General',
  'MarketStructure',
  'Entry',
  'RiskManagement',
  'Exit',
  'Psychology',
  'News',
];

export const STRATEGY_RULE_IMPORTANCES: StrategyRuleImportance[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

export interface Strategy {
  id: string;
  name: string;
  description: string | null;
  marketType: MarketType;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface StrategyRule {
  id: string;
  strategyId: string;
  title: string;
  description: string | null;
  order: number;
  isRequired: boolean;
  category: StrategyRuleCategory;
  importance: StrategyRuleImportance;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface CreateStrategyRequest {
  name: string;
  description?: string;
  marketType: MarketType;
  color?: string;
}

export interface UpdateStrategyRequest {
  name: string;
  description?: string;
  marketType: MarketType;
  color?: string;
}

export interface CreateStrategyRuleRequest {
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  category: StrategyRuleCategory;
  importance: StrategyRuleImportance;
}

export interface UpdateStrategyRuleRequest {
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  category: StrategyRuleCategory;
  importance: StrategyRuleImportance;
}
