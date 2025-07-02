import { useTradeStore } from '../store/tradeStore';
import { Trade } from '../types';

export function useStrategyTrades(strategyName: string) {
  const { trades } = useTradeStore();
  // Filter trades for this strategy name
  return trades.filter(t => t.strategy_name === strategyName);
}
