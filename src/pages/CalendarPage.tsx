import React, { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { Navbar } from '../components/Navbar';
import { useTradeStore } from '../store/tradeStore';
import { useWithdrawalStore } from '../store/withdrawalStore';
import { useAuthStore } from '../store/authStore';
import { useStrategyStore } from '../store/strategyStore';

const getMonthMatrix = (date: Date) => {
  const startMonth = startOfMonth(date);
  const endMonth = endOfMonth(date);
  const startDate = startOfWeek(startMonth, { weekStartsOn: 0 });
  const endDate = endOfWeek(endMonth, { weekStartsOn: 0 });
  const weeks = [];
  let day = startDate;
  while (day <= endDate) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }
  return weeks;
};

// List of all pairs for dropdown
const PAIRS = [
  'all',
  'XAUUSD', 'GBPUSD',
  'GBPJPY', 'AUDUSD', 'AUDJPY', 'CADJPY', 'EURGBP', 'USDJPY', 'USDCAD',
  'EURUSD', 'EURCHF'
];

export const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedPair, setSelectedPair] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all'); // NEW
  const [selectedAccount, setSelectedAccount] = useState<'Live' | 'Backtest' | 'all'>('all');
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const { trades, fetchTrades } = useTradeStore();
  const { withdrawals, fetchWithdrawals } = useWithdrawalStore();
  const { user } = useAuthStore();
  const { strategies, fetchStrategies } = useStrategyStore();
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrades();
    fetchWithdrawals();
    fetchStrategies();
  }, [fetchTrades, fetchWithdrawals, fetchStrategies]);

  // Close month picker on outside click
  useEffect(() => {
    if (!showMonthPicker) return;
    function handleClick(e: MouseEvent) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMonthPicker]);

  // Get unique timeframes from trades
  const allTimeframes = Array.from(new Set(trades.map(t => t.timeframe)));
  allTimeframes.sort();

  // Filter trades and withdrawals for the selected month, pair, timeframe, account, and strategy
  const monthStr = format(selectedDate, 'yyyy-MM');
  const tradesThisMonth = trades.filter(trade =>
    trade.date.startsWith(monthStr) &&
    (selectedPair === 'all' || trade.pair === selectedPair) &&
    (selectedTimeframe === 'all' || trade.timeframe === selectedTimeframe) &&
    (selectedAccount === 'all' || trade.account === selectedAccount) &&
    (selectedStrategy === 'all' || trade.strategy_name === selectedStrategy)
  );
  const withdrawalsThisMonth = withdrawals.filter(w => w.date.startsWith(monthStr));

  // Calculate stats
  const totalPL = tradesThisMonth.reduce((sum, t) => sum + t.result, 0);
  const totalWithdraw = withdrawalsThisMonth.reduce((sum, w) => sum + w.amount, 0);
  const winCount = tradesThisMonth.filter(t => t.result > 0).length;
  const totalCount = tradesThisMonth.length;
  const winRate = totalCount > 0 ? (winCount / totalCount) * 100 : 0;
  const avgTrade = totalCount > 0 ? totalPL / totalCount : 0;
  const roiPercent = user && user.startingBalance ? ((totalPL / user.startingBalance) * 100).toFixed(2) : '0.00';

  // Group trades by date (YYYY-MM-DD) and sum P&L and count trades for selected pair and timeframe
  const dailyPL: Record<string, number> = {};
  const dailyCount: Record<string, number> = {};
  trades.forEach(trade => {
    if (
      trade.date.startsWith(monthStr) &&
      (selectedPair === 'all' || trade.pair === selectedPair) &&
      (selectedTimeframe === 'all' || trade.timeframe === selectedTimeframe) &&
      (selectedAccount === 'all' || trade.account === selectedAccount) &&
      (selectedStrategy === 'all' || trade.strategy_name === selectedStrategy)
    ) {
      const day = trade.date.slice(0, 10); // YYYY-MM-DD
      dailyPL[day] = (dailyPL[day] || 0) + trade.result;
      dailyCount[day] = (dailyCount[day] || 0) + 1;
    }
  });

  // Find max absolute P&L for color intensity scaling
  const maxAbsPL = Math.max(...Object.values(dailyPL).map(v => Math.abs(v)), 1);

  const handlePrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const handleNextMonth = () => setSelectedDate(addMonths(selectedDate, 1));
  const handleMonthClick = () => setShowMonthPicker(true);
  const handleMonthSelect = (month: number, year: number) => {
    setSelectedDate(new Date(year, month, 1));
    setShowMonthPicker(false);
  };

  const monthMatrix = getMonthMatrix(selectedDate);
  const monthName = format(selectedDate, 'MMMM yyyy');

  return (
    <>
      <Navbar />
      <div className="w-full min-h-screen bg-white dark:bg-slate-900 p-4 flex flex-col items-center">
        <div className="w-full flex flex-col items-center">
          {/* Month and Pair Selectors */}
          <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <button onClick={handlePrevMonth} className="text-2xl px-2">&#8592;</button>
              <h2 className="text-2xl font-bold cursor-pointer select-none relative" onClick={handleMonthClick}>
                {monthName}
                {showMonthPicker && (
                  <div ref={monthPickerRef} className="absolute left-1/2 -translate-x-1/2 top-10 z-30 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-80 backdrop-blur-xl flex flex-col items-center animate-fade-in">
                    <div className="flex justify-between items-center w-full mb-4">
                      <button
                        className="text-lg px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        onClick={e => { e.stopPropagation(); setSelectedDate(new Date(selectedDate.getFullYear() - 1, selectedDate.getMonth(), 1)); }}
                      >&#8593;</button>
                      <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{selectedDate.getFullYear()}</span>
                      <button
                        className="text-lg px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        onClick={e => { e.stopPropagation(); setSelectedDate(new Date(selectedDate.getFullYear() + 1, selectedDate.getMonth(), 1)); }}
                      >&#8595;</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 w-full mb-4">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <button
                          key={i}
                          className={`px-3 py-2 rounded-lg font-semibold transition-colors text-slate-700 dark:text-slate-200 ${selectedDate.getMonth() === i ? 'bg-teal-500 text-white shadow' : 'hover:bg-teal-100 dark:hover:bg-teal-700'}`}
                          onClick={e => { e.stopPropagation(); handleMonthSelect(i, selectedDate.getFullYear()); }}
                        >
                          {format(new Date(selectedDate.getFullYear(), i, 1), 'MMM')}
                        </button>
                      ))}
                    </div>
                    <button
                      className="mt-2 w-full py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      onClick={e => { e.stopPropagation(); setShowMonthPicker(false); }}
                    >Close</button>
                  </div>
                )}
              </h2>
              <button onClick={handleNextMonth} className="text-2xl px-2">&#8594;</button>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPair}
                onChange={e => setSelectedPair(e.target.value)}
                className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {PAIRS.map(pair => (
                  <option key={pair} value={pair}>{pair === 'all' ? 'All Pairs' : pair}</option>
                ))}
              </select>
              <select
                value={selectedTimeframe}
                onChange={e => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Timeframes</option>
                {allTimeframes.map(tf => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
              <select
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value as 'Live' | 'Backtest' | 'all')}
                className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Accounts</option>
                <option value="Live">Live</option>
                <option value="Backtest">Backtest</option>
              </select>
              <select
                value={selectedStrategy}
                onChange={e => setSelectedStrategy(e.target.value)}
                className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Strategies</option>
                {strategies.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mb-8">
            {/* Total P&L Card (first) */}
            <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl shadow p-4 flex flex-col items-center border border-blue-100 dark:border-blue-700 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20V4m0 0l-6 6m6-6l6 6" /></svg>
                </span>
                <span className="text-base font-semibold text-blue-700 dark:text-blue-300">Total P&amp;L</span>
              </div>
              <div className={`text-2xl font-extrabold ${totalPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mb-1`}>{totalPL >= 0 ? '+' : ''}{totalPL.toFixed(2)}</div>
            </div>
            {/* Win Rate Card (second) */}
            <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl shadow p-4 flex flex-col items-center border border-teal-100 dark:border-slate-700 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900">
                  <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>
                </span>
                <span className="text-base font-semibold text-teal-700 dark:text-teal-300">Win Rate</span>
              </div>
              <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mb-1">{winRate.toFixed(1)}%</div>
            </div>
            {/* ROI Card (third) */}
            <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl shadow p-4 flex flex-col items-center border border-green-100 dark:border-green-700 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-green-900">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20V4m0 0l-6 6m6-6l6 6" /></svg>
                </span>
                <span className="text-base font-semibold text-green-700 dark:text-green-300">ROI</span>
              </div>
              <div className={`text-2xl font-extrabold ${parseFloat(roiPercent) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mb-1`}>{roiPercent}%</div>
            </div>
            {/* Avg. Trade Result Card (last) */}
            <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl shadow p-4 flex flex-col items-center border border-slate-200 dark:border-slate-700 transition-colors">
              <div className="text-base font-semibold text-slate-500 dark:text-slate-400 mb-1">Avg. Trade Result</div>
              <div className={`text-2xl font-extrabold ${avgTrade > 0 ? 'text-green-600 dark:text-green-400' : avgTrade < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>{avgTrade >= 0 ? '+' : ''}${avgTrade.toFixed(2)}</div>
            </div>
          </div>
          {/* Calendar */}
          <div className="w-full max-w-5xl bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow p-0 overflow-hidden">
            <div className="grid grid-cols-7 border-t border-l border-slate-300 dark:border-slate-700">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 border-b border-r border-slate-300 dark:border-slate-700 py-2">
                  {d}
                </div>
              ))}
            </div>
            {monthMatrix.map((week, i) => (
              <div key={i} className="grid grid-cols-7 border-l border-slate-300 dark:border-slate-700">
                {week.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const pl = dailyPL[dayStr];
                  const count = dailyCount[dayStr] || 0;
                  let style: React.CSSProperties = { minHeight: 120, minWidth: 80, borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', background: 'transparent' };
                  let textColor = 'text-black dark:text-white';
                  if (typeof pl === 'number' && pl !== 0) {
                    const intensity = Math.min(1, 0.15 + 0.85 * Math.abs(pl) / maxAbsPL);
                    if (pl > 0) {
                      // Green: from #bbf7d0 (light) to #166534 (dark)
                      const green = [187, 247, 208];
                      const darkGreen = [22, 101, 52];
                      const r = Math.round(green[0] + (darkGreen[0] - green[0]) * intensity);
                      const g = Math.round(green[1] + (darkGreen[1] - green[1]) * intensity);
                      const b = Math.round(green[2] + (darkGreen[2] - green[2]) * intensity);
                      style.background = `rgb(${r},${g},${b})`;
                    } else {
                      // Red: from #fecaca (light) to #7f1d1d (dark)
                      const red = [254, 202, 202];
                      const darkRed = [127, 29, 29];
                      const r = Math.round(red[0] + (darkRed[0] - red[0]) * intensity);
                      const g = Math.round(red[1] + (darkRed[1] - red[1]) * intensity);
                      const b = Math.round(red[2] + (darkRed[2] - red[2]) * intensity);
                      style.background = `rgb(${r},${g},${b})`;
                    }
                  }
                  if (!isSameMonth(day, selectedDate)) {
                    style.background = undefined;
                    if (document.documentElement.classList.contains('dark')) {
                      style.background = '#1e293b'; // slate-800 for dark
                      textColor = 'text-slate-500';
                    } else {
                      style.background = '#f1f5f9'; // slate-100 for light
                      textColor = 'text-slate-400';
                    }
                  }
                  return (
                    <div
                      key={day.toISOString()}
                      className={`relative flex flex-col items-start justify-start px-2 pt-1 pb-2 ${textColor} font-semibold select-none`}
                      style={style}
                    >
                      <span className="absolute top-1 left-2 text-xs opacity-80">{format(day, 'd')}</span>
                      <div className="flex flex-col items-center justify-center w-full h-full mt-4">
                        {typeof pl === 'number' && (
                          <span className="text-base font-bold">
                            {pl > 0 ? '+' : ''}${pl.toFixed(2)}
                          </span>
                        )}
                        {count > 0 && (
                          <span className="text-xs mt-1 opacity-80">{count} trade{count === 1 ? '' : 's'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
