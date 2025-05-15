import React, { useEffect } from 'react';
import { useTradeStore } from '../store/tradeStore';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const TradeHistory: React.FC = () => {
  const { trades, fetchTrades, isLoading, error } = useTradeStore();
  
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);
  
  if (isLoading && trades.length === 0) {
    return (
      <div className="flex justify-center p-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded-md">
        <p className="text-sm text-red-200">Error loading trades: {error}</p>
      </div>
    );
  }
  
  if (trades.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center">
        <p className="text-lg text-slate-300">No trades recorded yet.</p>
        <p className="text-slate-400 mt-1">Add your first trade to start tracking your performance!</p>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
      <h2 className="text-xl font-semibold p-6 border-b border-slate-700">Trading History</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Pair</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Direction</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">SL/TP (Pips)</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">RR</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Outcome</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Result</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Balance After</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Image</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 text-sm">{format(parseISO(trade.date), 'MMM dd, yyyy')}</td>
                <td className="px-4 py-3 text-sm">{trade.pair}</td>
                <td className="px-4 py-3">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    trade.direction === 'long' 
                      ? 'bg-green-900/40 text-green-400'
                      : 'bg-red-900/40 text-red-400'
                  }`}>
                    {trade.direction === 'long' 
                      ? <TrendingUp size={14} /> 
                      : <TrendingDown size={14} />}
                    {trade.direction === 'long' ? 'Long' : 'Short'}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{trade.slPips} / {trade.tpPips}</td>
                <td className="px-4 py-3 text-sm">{trade.riskRewardRatio}:1</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    trade.outcome === 'win' 
                      ? 'bg-green-900/40 text-green-400'
                      : trade.outcome === 'loss'
                        ? 'bg-red-900/40 text-red-400'
                        : 'bg-yellow-900/40 text-yellow-400'
                  }`}>
                    {trade.outcome === 'win' 
                      ? 'Win' 
                      : trade.outcome === 'loss' 
                        ? 'Loss' 
                        : 'BE'}
                  </span>
                </td>
                <td className={`px-4 py-3 text-sm font-medium ${
                  trade.result > 0 
                    ? 'text-green-400'
                    : trade.result < 0
                      ? 'text-red-400'
                      : 'text-slate-300'
                }`}>
                  {trade.result > 0 ? '+' : ''}{trade.result.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">${trade.balanceAfterTrade.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">
                  {trade.imageLink ? (
                    <a 
                      href={trade.imageLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
                    >
                      <ExternalLink size={14} />
                      View
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};