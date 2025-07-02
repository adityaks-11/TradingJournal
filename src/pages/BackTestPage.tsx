import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Grid, Layout, Plus, Sparkles } from 'lucide-react';
import { useStrategyStore } from '../store/strategyStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { StrategyExpandedCard } from '../components/StrategyExpandedCard';
import { useTradeStore } from '../store/tradeStore';
import { MonthSelector } from '../components/MonthSelector';
import { addDays, startOfMonth, endOfMonth, format } from 'date-fns';

export const BacktestPage: React.FC = () => {
  const [layout, setLayout] = useState<'grid' | 'rect'>('rect');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newStrategy, setNewStrategy] = useState('');
  const { strategies, fetchStrategies } = useStrategyStore();
  const { user } = useAuthStore();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  // Add strategy handler
  const handleAddStrategy = async () => {
    if (!newStrategy.trim()) return;
    if (!user || !user.id) return;
    const { error } = await supabase
      .from('strategies')
      .insert([
        {
          name: newStrategy.trim(),
          user_id: user.id,
          type: 'backtest',
        } as any
      ]);
    if (!error) {
      setNewStrategy('');
      setShowAdd(false);
      fetchStrategies();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1800);
    } else {
      alert('Failed to add strategy: ' + error.message);
    }
  };

  // For 6-7 cards per row, calculate width
  const baseCardWidth = expanded ? `calc((100vw - 2rem) / 7)` : `calc((100vw - 2rem) / 7)`;
  const expandedCardWidth = `calc(${baseCardWidth} * 3.5)`;

  // Pagination for grid layout
  const CARDS_PER_PAGE = 4;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(strategies.length / CARDS_PER_PAGE);
  const pagedStrategies = strategies.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);

  // Comparison state for grid layout
  const [compare, setCompare] = useState<string[]>([]);
  // Month selection per strategy in grid (use Date)
  const [gridMonths, setGridMonths] = useState<Record<string, Date>>({});

  // Helper to get month string (YYYY-MM) from Date
  const getMonthStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-teal-50 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors relative overflow-x-hidden">
      {/* Animated Confetti */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <Sparkles size={120} className="text-teal-400 animate-spin-slow opacity-70" />
        </div>
      )}
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 relative">
        {/* Removed Hero Header */}
        <div className="flex justify-between mb-6">
          {/* Add Strategy Button */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-teal-600 text-white font-semibold hover:bg-teal-700 active:scale-95 transition-all shadow-lg focus:ring-2 focus:ring-teal-400 animate-fade-in"
              onClick={() => setShowAdd(v => !v)}
              title="Add a new strategy"
            >
              <Plus size={18} /> Add Strategy
            </button>
            {showAdd && (
              <div className="flex items-center gap-2 ml-2 animate-fade-in">
                <input
                  type="text"
                  value={newStrategy}
                  onChange={e => setNewStrategy(e.target.value)}
                  placeholder="Strategy name"
                  className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm animate-fade-in"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleAddStrategy(); }}
                />
                <button
                  className="px-3 py-1 rounded bg-teal-500 text-white font-semibold hover:bg-teal-600 active:scale-95 transition-all shadow"
                  onClick={handleAddStrategy}
                >Add</button>
                <button
                  className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all"
                  onClick={() => { setShowAdd(false); setNewStrategy(''); }}
                >Cancel</button>
              </div>
            )}
          </div>
          {/* Layout Switcher */}
          <div className="flex gap-2">
            <button
              className={`p-2 rounded-md border transition-all duration-150 shadow-sm hover:scale-105 group ${layout === 'grid' ? 'bg-teal-600 text-white border-teal-700' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'}`}
              onClick={() => setLayout('grid')}
              title="Grid Layout (Quick Stats)"
            >
              <Grid size={20} />
              <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Grid</span>
            </button>
            <button
              className={`p-2 rounded-md border transition-all duration-150 shadow-sm hover:scale-105 group ${layout === 'rect' ? 'bg-teal-600 text-white border-teal-700' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'}`}
              onClick={() => setLayout('rect')}
              title="Rectangular Card Layout (Analytics)"
            >
              <Layout size={20} />
              <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Rect</span>
            </button>
          </div>
        </div>
        {/* No strategies illustration */}
        {strategies.length === 0 && (
          <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
            <Sparkles size={64} className="text-teal-300 mb-4 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-500 dark:text-slate-300 mb-2">No strategies yet</h2>
            <p className="text-slate-400 dark:text-slate-500 mb-4">Click "Add Strategy" to get started!</p>
          </div>
        )}
        {/* Rectangular Layout */}
        {layout === 'rect' && strategies.length > 0 && (
          <div className="flex flex-row items-stretch w-full h-[70vh] gap-0 overflow-x-auto animate-fade-in" style={{ minHeight: '70vh' }}>
            {strategies.map((strategy, idx) => {
              const isExpanded = expanded === strategy.id;
              return (
                <div
                  key={strategy.id}
                  className={`relative flex items-end justify-center transition-all duration-300 ease-in-out cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:z-20 ${isExpanded ? 'z-30 shadow-2xl scale-105 ring-2 ring-teal-400' : 'z-10'} animate-fade-in`}
                  style={{
                    width: isExpanded ? expandedCardWidth : baseCardWidth,
                    minWidth: isExpanded ? expandedCardWidth : baseCardWidth,
                    maxWidth: isExpanded ? expandedCardWidth : baseCardWidth,
                    height: '100%',
                    marginLeft: idx === 0 ? 0 : '-2px',
                  }}
                  onClick={() => !isExpanded && setExpanded(strategy.id)}
                >
                  {isExpanded ? (
                    <div className="w-full h-full flex flex-col min-h-0 min-w-0 cursor-default animate-fade-in" onClick={e => e.stopPropagation()}>
                      {/* Expanded card content */}
                      <StrategyExpandedCard strategyName={strategy.name} trades={useTradeStore.getState().trades.filter(t => t.strategy_name === strategy.name)} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-end h-full w-full pb-6 select-none animate-fade-in">
                      <div className="flex flex-col items-center justify-end h-full w-full">
                        <span className="text-2xl font-bold text-slate-400 mb-2" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.1em' }}>{idx + 1}</span>
                        <span className="text-lg font-semibold text-slate-700 dark:text-slate-200" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.1em' }}>{strategy.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* Grid Layout */}
        {layout === 'grid' && strategies.length > 0 && (
          <div className="w-full animate-fade-in" style={{ minHeight: '48rem', maxHeight: '48rem' }}>
            <div
              className="grid grid-cols-2 grid-rows-2 gap-8 h-full"
              style={{ height: '44rem' }}
            >
              {pagedStrategies.map((strategy, idx) => {
                // Month selection for this card
                const monthDate = gridMonths[strategy.id] || new Date();
                const monthStr = getMonthStr(monthDate);
                // Get trades for this strategy and month
                const trades = useTradeStore.getState().trades.filter(t => t.strategy_name === strategy.name && t.date.startsWith(monthStr));
                const totalPL = trades.reduce((sum, t) => sum + t.result, 0);
                const wins = trades.filter(t => t.outcome === 'win').length;
                const total = trades.length;
                const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
                const avgWin = total > 0 ? (trades.reduce((sum, t) => sum + (t.result > 0 ? t.result : 0), 0) / total) : 0;
                // Top pair
                const pairStats: Record<string, { wins: number; total: number }> = {};
                trades.forEach(t => {
                  if (!pairStats[t.pair]) pairStats[t.pair] = { wins: 0, total: 0 };
                  if (t.outcome === 'win') pairStats[t.pair].wins++;
                  pairStats[t.pair].total++;
                });
                const topPair = Object.entries(pairStats)
                  .map(([pair, s]) => ({ pair, winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0 }))
                  .sort((a, b) => b.winRate - a.winRate)[0];
                // Accent color for P&L
                const accent = totalPL > 0 ? 'bg-gradient-to-r from-teal-400 to-green-400' : totalPL < 0 ? 'bg-gradient-to-r from-rose-400 to-red-500' : 'bg-gradient-to-r from-slate-300 to-slate-400';
                const isCompared = compare.includes(strategy.id);

                // Calendar heatmap data
                const start = startOfMonth(monthDate);
                const end = endOfMonth(monthDate);
                const days: Date[] = [];
                for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
                // Day labels (Su, Mo, etc.)
                const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
                // Map date string to P&L
                const plByDate: Record<string, number> = {};
                trades.forEach(t => {
                  const d = t.date.slice(0, 10);
                  plByDate[d] = (plByDate[d] || 0) + t.result;
                });
                // Table data: only days with trades, now also include pair and timeframe
                // For each date, get all trades for that date, and show the top pair (by P&L) and time frame for the day
                const tradesByDate: Record<string, { pl: number; pair: string; timeframe: string }> = {};
                trades.forEach(t => {
                  const d = t.date.slice(0, 10);
                  if (!tradesByDate[d]) tradesByDate[d] = { pl: 0, pair: t.pair, timeframe: t.timeframe };
                  tradesByDate[d].pl += t.result;
                  // If this trade's P&L is higher than the current, set as top pair and timeframe for the day
                  if (t.result > 0 && t.result > (tradesByDate[d].pl || 0)) {
                    tradesByDate[d].pair = t.pair;
                    tradesByDate[d].timeframe = t.timeframe;
                  }
                });
                const tableRows = Object.entries(tradesByDate).map(([date, { pl, pair, timeframe }]) => ({ date, pl, pair, timeframe }));
                tableRows.sort((a, b) => a.date.localeCompare(b.date));

                return (
                  <div
                    key={strategy.id}
                    className={`relative flex flex-col bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-md p-0 h-80 transition-all duration-300 ease-in-out cursor-pointer hover:shadow-xl hover:scale-105 animate-fade-in group overflow-hidden ${isCompared ? 'ring-4 ring-teal-400' : ''}`}
                    onClick={() => setExpanded(strategy.id)}
                  >
                    {/* Accent bar */}
                    <div className={`absolute left-0 top-0 h-full w-2 ${accent} rounded-l-xl animate-fade-in`} />
                    {/* Top row: number, name, month selector, compare checkbox */}
                    <div className="flex items-center justify-between w-full px-6 pt-4 pb-2">
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">#{page * CARDS_PER_PAGE + idx + 1}</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">{strategy.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MonthSelector
                          value={monthDate}
                          onChange={val => setGridMonths(m => ({ ...m, [strategy.id]: val }))}
                        />
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={e => {
                              e.stopPropagation();
                              setCompare(c => c.includes(strategy.id)
                                ? c.filter(id => id !== strategy.id)
                                : [...c, strategy.id]);
                            }}
                            onClick={e => e.stopPropagation()}
                            className="accent-teal-500"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Compare</span>
                        </label>
                      </div>
                    </div>
                    {/* Stat cards row */}
                    <div className="grid grid-cols-4 gap-2 px-6 mt-2">
                      <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">P&L</span>
                        <span className={`text-base font-bold ${totalPL > 0 ? 'text-teal-700 dark:text-teal-300' : totalPL < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>${totalPL.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Win Rate</span>
                        <span className="text-base font-bold text-green-700 dark:text-green-300">{winRate}%</span>
                      </div>
                      <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Avg Win</span>
                        <span className="text-base font-bold text-blue-700 dark:text-blue-300">${avgWin.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Trades</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">{total}</span>
                      </div>
                    </div>
                    {/* Calendar and table row */}
                    <div className="flex flex-row gap-6 px-6 mt-4 items-start justify-start">
                      {/* Calendar heatmap */}
                      <div className="flex flex-col min-w-[7.5rem] w-[7.5rem]">
                        {/* Day labels */}
                        <div className="grid grid-cols-7 gap-0.5 w-full mb-1">
                          {dayLabels.map(label => (
                            <div key={label} className="text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center">{label}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5 w-full h-20">
                          {days.map(d => {
                            const ds = format(d, 'yyyy-MM-dd');
                            let color = 'bg-slate-200 dark:bg-slate-700';
                            if (plByDate[ds] > 0) color = 'bg-green-400 dark:bg-green-600';
                            else if (plByDate[ds] < 0) color = 'bg-rose-400 dark:bg-rose-600';
                            else if (plByDate[ds] === 0 && ds in plByDate) color = 'bg-slate-400 dark:bg-slate-500';
                            return (
                              <div key={ds} className={`w-4 h-3 rounded-sm ${color} border border-slate-300 dark:border-slate-800`} title={ds}></div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Table of date, pair, time frame, and P&L */}
                      <div className="flex-1 overflow-y-auto max-h-20">
                        <table className="text-xs w-full table-fixed">
                          <colgroup>
                            <col style={{ width: '22%' }} />
                            <col style={{ width: '26%' }} />
                            <col style={{ width: '26%' }} />
                            <col style={{ width: '26%' }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th className="text-center font-bold text-slate-700 dark:text-slate-200">Date</th>
                              <th className="text-center font-bold text-slate-700 dark:text-slate-200">Pair</th>
                              <th className="text-center font-bold text-slate-700 dark:text-slate-200">Time Frame</th>
                              <th className="text-center font-bold text-slate-700 dark:text-slate-200">P&L</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tableRows.length === 0 && (
                              <tr><td colSpan={4} className="text-slate-400 dark:text-slate-500 text-center">No trades</td></tr>
                            )}
                            {tableRows.map(row => (
                              <tr key={row.date} className="">
                                <td className="text-slate-800 dark:text-slate-100 text-center">{row.date.slice(8, 10)}</td>
                                <td className="text-slate-700 dark:text-slate-200 text-center">{row.pair}</td>
                                <td className="text-slate-700 dark:text-slate-200 text-center">{row.timeframe}</td>
                                <td className={`text-center font-semibold ${row.pl > 0 ? 'text-teal-700 dark:text-teal-300' : row.pl < 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>{row.pl > 0 ? '+' : ''}{row.pl.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Top pair and details */}
                    <div className="flex flex-row justify-between items-center px-6 mt-2">
                      {topPair ? (
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-left">
                          Top Pair: <span className="font-bold text-slate-900 dark:text-white">{topPair.pair}</span> <span className="text-green-700 dark:text-green-300 font-bold">{topPair.winRate}%</span>
                        </div>
                      ) : <div />}
                      {/* Removed View Details button */}
                    </div>
                    {/* Gradient background */}
                    <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-br from-teal-50/60 via-white/40 to-slate-100/60 dark:from-slate-900/60 dark:via-slate-800/40 dark:to-slate-900/60 animate-fade-in" />
                  </div>
                );
              })}
              {/* Fill empty slots if less than 4 cards on last page */}
              {Array.from({ length: CARDS_PER_PAGE - pagedStrategies.length }).map((_, i) => (
                <div key={i} />
              ))}
            </div>
            {/* Comparison bar */}
            {compare.length >= 2 && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-teal-400 rounded-xl shadow-lg px-8 py-4 flex gap-8 z-50 animate-fade-in">
                {compare.map(id => {
                  const strat = strategies.find(s => s.id === id);
                  if (!strat) return null;
                  const monthDate = gridMonths[id] || new Date();
                  const monthStr = getMonthStr(monthDate);
                  const trades = useTradeStore.getState().trades.filter(t => t.strategy_name === strat.name && t.date.startsWith(monthStr));
                  const totalPL = trades.reduce((sum, t) => sum + t.result, 0);
                  const wins = trades.filter(t => t.outcome === 'win').length;
                  const total = trades.length;
                  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
                  const avgWin = total > 0 ? (trades.reduce((sum, t) => sum + (t.result > 0 ? t.result : 0), 0) / total) : 0;
                  return (
                    <div key={id} className="flex flex-col items-center min-w-[120px]">
                      <span className="text-sm font-bold text-teal-600 mb-1">{strat.name}</span>
                      <div className="flex flex-row gap-2">
                        <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-1">
                          <span className="text-xs text-slate-500">P&L</span>
                          <span className={`text-sm font-bold ${totalPL > 0 ? 'text-teal-600' : totalPL < 0 ? 'text-rose-600' : 'text-slate-500'}`}>${totalPL.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-1">
                          <span className="text-xs text-slate-500">Win</span>
                          <span className="text-sm font-bold text-green-600">{winRate}%</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-1">
                          <span className="text-xs text-slate-500">Avg Win</span>
                          <span className="text-sm font-bold text-blue-600">${avgWin.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-1">
                          <span className="text-xs text-slate-500">Trades</span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{total}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button className="ml-8 px-4 py-2 rounded bg-teal-500 text-white font-semibold shadow hover:bg-teal-600 active:scale-95 transition-all" onClick={() => setCompare([])}>Clear</button>
              </div>
            )}
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-4 animate-fade-in">
                <button
                  className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-50 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >Prev</button>
                <span className="text-slate-600 dark:text-slate-300">Page {page + 1} of {totalPages}</span>
                <button
                  className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-50 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >Next</button>
              </div>
            )}
          </div>
        )}
      </main>
      {/* Animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,2,.3,1) both; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-slow { animation: bounce-slow 2.2s infinite; }
        @keyframes spin-slow { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
        .animate-spin-slow { animation: spin-slow 2.5s linear infinite; }
      `}</style>
    </div>
  );
};
