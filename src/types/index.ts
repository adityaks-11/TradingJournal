export interface User {
  id: string;
  email: string;
  startingBalance: number;
  currentBalance: number;
}

export type TradeDirection = 'long' | 'short';
export type TradeOutcome = 'win' | 'loss' | 'BE';

export interface Trade {
  id: string;
  userId: string;
  date: string;
  pair: string;
  session: string;
  direction: TradeDirection;
  slPips: number;
  tpPips: number;
  riskRewardRatio: number;
  outcome: TradeOutcome;
  result: number;
  timeframe: string; // was balanceAfterTrade
  imageLink?: string;
  remarks?: string;
  account: string; // 'Live' or 'Backtest'
  strategy?: string; // strategy id, optional
  strategy_name?: string; // Add this for compatibility with the DB column
}

export interface Withdrawal {
  id: string;
  userId: string;
  date: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  remarks?: string;
}