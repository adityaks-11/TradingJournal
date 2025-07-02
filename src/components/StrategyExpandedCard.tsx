import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Trade } from '../types';
import { MonthSelector } from './MonthSelector';

interface StrategyExpandedCardProps {
  strategyName: string;
  trades: Trade[];
}

export const StrategyExpandedCard: React.FC<StrategyExpandedCardProps> = ({ strategyName, trades }) => {
  // Use real current month as default
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedMonth = format(selectedDate, 'yyyy-MM');

  // Filter trades for this month
  const monthTrades = useMemo(() => {
    return trades.filter(t => t.date.startsWith(selectedMonth));
  }, [trades, selectedMonth]);

  // Chart data: cumulative P&L by day
  const chartData = useMemo(() => {
    let daily: Record<string, number> = {};
    let runningPL = 0;
    monthTrades.forEach(trade => {
      runningPL += trade.result;
      daily[trade.date] = runningPL;
    });
    return Object.entries(daily).map(([date, pl]) => ({
      date: format(parseISO(date), 'MMM d'),
      pl,
    }));
  }, [monthTrades]);

  // Stats
  const totalPL = monthTrades.reduce((sum, t) => sum + t.result, 0);
  const wins = monthTrades.filter(t => t.outcome === 'win').length;
  const total = monthTrades.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  // Use starting balance for ROI if available, else fallback to 1
  const startingBalance = trades.length > 0 ? trades[0].result : 1;
  const roi = total > 0 ? ((totalPL / startingBalance) * 100).toFixed(2) : '0.00';

  // Top 5 pairs by win rate
  const topPairs = useMemo(() => {
    const stats: Record<string, { wins: number; total: number }> = {};
    monthTrades.forEach(t => {
      if (!stats[t.pair]) stats[t.pair] = { wins: 0, total: 0 };
      if (t.outcome === 'win') stats[t.pair].wins++;
      stats[t.pair].total++;
    });
    return Object.entries(stats)
      .map(([pair, s]) => ({ pair, winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0 }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);
  }, [monthTrades]);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{strategyName}</h2>
        <MonthSelector value={selectedDate} onChange={setSelectedDate} />
      </div>
      <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }} formatter={v => [`$${v}`, 'P&L']} />
            <Line type="monotone" dataKey="pl" stroke="#14b8a6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-xs text-slate-500 mb-1">P&L</div>
          <div className="text-xl font-bold text-teal-600">${totalPL.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-xs text-slate-500 mb-1">Win Rate</div>
          <div className="text-xl font-bold text-green-600">{winRate}%</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-xs text-slate-500 mb-1">ROI</div>
          <div className="text-xl font-bold text-blue-600">{roi}%</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-xs text-slate-500 mb-1">Trades</div>
          <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{total}</div>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-200">Top 5 Pairs</h3>
        <div className="flex flex-col gap-2">
          {topPairs.length === 0 && <div className="text-slate-400">No trades this month.</div>}
          {topPairs.map(pair => (
            <div key={pair.pair} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 rounded p-2">
              <span className="font-medium text-slate-700 dark:text-slate-200">{pair.pair}</span>
              <span className="text-green-600 font-bold">{pair.winRate}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
