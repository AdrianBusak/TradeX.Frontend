export type TradingAccountType =
  | 'Personal'
  | 'Demo'
  | 'PropChallenge'
  | 'PropFunded'
  | 'BrokerLive';

export const TRADING_ACCOUNT_TYPES: TradingAccountType[] = [
  'Personal',
  'Demo',
  'PropChallenge',
  'PropFunded',
  'BrokerLive',
];

export interface TradingAccount {
  id: string;
  name: string;
  accountType: TradingAccountType;
  broker: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface TradingAccountLookup {
  id: string;
  display: string;
  isActive: boolean;
}

export interface CreateTradingAccountRequest {
  name: string;
  accountType: TradingAccountType;
  broker: string;
  currency: string;
  initialBalance: number;
  currentBalance?: number;
}

export interface UpdateTradingAccountRequest {
  name: string;
  accountType: TradingAccountType;
  broker: string;
  currency: string;
  initialBalance: number;
  currentBalance: number;
}
