import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTradeStore } from '../store/tradeStore';
import { useWithdrawalStore } from '../store/withdrawalStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { format, parseISO, getDay } from 'date-fns';
import { Pencil, Calendar } from 'lucide-react';
import { EditStartingBalanceModal } from './EditStartingBalanceModal';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// List of all pairs for dropdown (same as in TradeForm)
const PAIRS = [
  'XAUUSD', 'GBPUSD',
  'GBPJPY', 'AUDUSD', 'AUDJPY', 'CADJPY', 'EURGBP', 'USDJPY', 'USDCAD',
  'EURUSD', 'EURCHF'
];

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { trades, fetchTrades } = useTradeStore();
  const { withdrawals, fetchWithdrawals } = useWithdrawalStore();
  const [balanceHistory, setBalanceHistory] = useState<Array<{ date: string; balance: number }>>([]);

  // State for edit starting balance modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Date range state
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  // Add state for selectedPair
  const [selectedPair, setSelectedPair] = useState<string>('all');

  // Add state for selectedTimeframe
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');

  // Modal state for expanded chart
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  // State for card filters
  const [cardFilters, setCardFilters] = useState({
    pnl: { mode: 'quick', quick: 'all', range: { start: '', end: '' } },
    withdrawals: { mode: 'quick', quick: 'all', range: { start: '', end: '' } },
    winrate: { mode: 'quick', quick: 'all', range: { start: '', end: '' } },
  });

  // State for global filter
  const [globalFilter, setGlobalFilter] = useState({ mode: 'quick', quick: 'all', range: { start: '', end: '' } });

  useEffect(() => {
    fetchTrades();
    fetchWithdrawals();
  }, [fetchTrades, fetchWithdrawals]);

  useEffect(() => {
    if (user && trades.length > 0) {
      // Sort trades by date
      const sortedTrades = [...trades].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Create balance history
      const history = sortedTrades.map(trade => ({
        date: format(parseISO(trade.date), 'MMM dd'),
        balance: user.startingBalance + sortedTrades.slice(0, sortedTrades.indexOf(trade) + 1).reduce((sum, t) => sum + t.result, 0)
      }));

      // Add starting point
      if (user.startingBalance) {
        history.unshift({
          date: 'Start',
          balance: user.startingBalance
        });
      }

      setBalanceHistory(history);
    }
  }, [user, trades]);

  // Get unique pairs from trades for selector
  const allPairs = React.useMemo(() => {
    const pairs = Array.from(new Set(trades.map(t => t.pair)));
    pairs.sort();
    return ['all', ...pairs];
  }, [trades]);

  // Get unique timeframes from trades
  const allTimeframes = React.useMemo(() => {
    const tfs = Array.from(new Set(trades.map(t => t.timeframe)));
    tfs.sort();
    return ['all', ...tfs];
  }, [trades]);

  // Helper to filter by date range
  const isWithinRange = (dateStr: string) => {
    if (!dateRange.start && !dateRange.end) return true;
    const date = new Date(dateStr);
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  };

  // Filter trades and withdrawals by date, pair, and timeframe
  const filteredTrades = React.useMemo(() => {
    return trades.filter(trade => {
      const inDateRange = isWithinRange(trade.date);
      const inPair = selectedPair === 'all' ? true : trade.pair === selectedPair;
      const inTimeframe = selectedTimeframe === 'all' ? true : trade.timeframe === selectedTimeframe;
      return inDateRange && inPair && inTimeframe;
    });
  }, [trades, selectedPair, selectedTimeframe, dateRange]);

  const filteredWithdrawals = React.useMemo(() => {
    return withdrawals.filter(w => {
      const inDateRange = isWithinRange(w.date);
      return inDateRange;
    });
  }, [withdrawals, dateRange]);

  // Calculate statistics (use filteredTrades)
  const totalTrades = filteredTrades.length;
  const winTrades = filteredTrades.filter(t => t.outcome === 'win').length;
  const lossTrades = filteredTrades.filter(t => t.outcome === 'loss').length;
  const beTrades = filteredTrades.filter(t => t.outcome === 'BE').length;
  const winRate = totalTrades > 0 ? Math.round((winTrades / totalTrades) * 100) : 0;
  const totalProfit = filteredTrades.reduce((sum, trade) => sum + trade.result, 0);
  const roiPercent = user && user.startingBalance ? ((totalProfit / user.startingBalance) * 100).toFixed(2) : '0.00';
  const totalWithdrawals = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const outcomeData = [
    { name: 'Win', value: winTrades },
    { name: 'Loss', value: lossTrades },
    { name: 'Break Even', value: beTrades }
  ].filter(item => item.value > 0);

  // Balance history (recalculate for filtered trades)
  useEffect(() => {
    if (user && filteredTrades.length > 0) {
      const sortedTrades = [...filteredTrades].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const history = sortedTrades.map(trade => ({
        date: format(parseISO(trade.date), 'MMM dd'),
        balance: trade.balanceAfterTrade
      }));
      if (user.startingBalance) {
        history.unshift({
          date: 'Start',
          balance: user.startingBalance
        });
      }
      setBalanceHistory(history);
    } else if (user) {
      setBalanceHistory(user.startingBalance ? [{ date: 'Start', balance: user.startingBalance }] : []);
    }
  }, [user, filteredTrades]);

  // Handler functions for starting balance update
  const handleOpenEditModal = () => {
    if (user) {
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  // Compute winRateHistory for Win Rate Over Time chart
  const winRateHistory = React.useMemo(() => {
    if (!filteredTrades || filteredTrades.length === 0) return [];
    let wins = 0;
    return filteredTrades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((trade, idx) => {
        if (trade.outcome === 'win') wins++;
        const winRate = Math.round((wins / (idx + 1)) * 100);
        return {
          date: format(parseISO(trade.date), 'MMM dd'),
          winRate,
        };
      });
  }, [filteredTrades]);

  // Compute directionData for Trades by Direction pie chart
  const directionData = React.useMemo(() => {
    if (!filteredTrades || filteredTrades.length === 0) return [];
    const longCount = filteredTrades.filter(t => t.direction === 'long').length;
    const shortCount = filteredTrades.filter(t => t.direction === 'short').length;
    return [
      { name: 'Long', value: longCount },
      { name: 'Short', value: shortCount },
    ].filter(item => item.value > 0);
  }, [filteredTrades]);

  // Compute win rate by pair for all trades in date range (not filtered by selectedPair)
  const winRateByPair = React.useMemo(() => {
    // Use only date range filter, not pair filter
    const tradesInRange = trades.filter(trade => {
      // Use your date range filter logic here
      const inDateRange = /* your date range filter logic here */ true;
      return inDateRange;
    });
    const pairStats: Record<string, { wins: number; total: number }> = {};
    tradesInRange.forEach(trade => {
      if (!pairStats[trade.pair]) pairStats[trade.pair] = { wins: 0, total: 0 };
      if (trade.outcome === 'win') pairStats[trade.pair].wins++;
      pairStats[trade.pair].total++;
    });
    return Object.entries(pairStats)
      .map(([pair, stats]) => ({
        pair,
        winRate: stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0
      }))
      .sort((a, b) => b.winRate - a.winRate);
  }, [trades /*, date range state */]);

  // Compute average SL and TP by pair for all trades in date range (not filtered by selectedPair)
  const avgSLTPByPair = React.useMemo(() => {
    // Use only date range filter, not pair filter
    const tradesInRange = trades.filter(trade => {
      // Use your date range filter logic here
      const inDateRange = /* your date range filter logic here */ true;
      return inDateRange;
    });
    const pairStats: Record<string, { slSum: number; tpSum: number; count: number }> = {};
    tradesInRange.forEach(trade => {
      if (!pairStats[trade.pair]) pairStats[trade.pair] = { slSum: 0, tpSum: 0, count: 0 };
      pairStats[trade.pair].slSum += trade.slPips;
      pairStats[trade.pair].tpSum += trade.tpPips;
      pairStats[trade.pair].count++;
    });
    return Object.entries(pairStats)
      .map(([pair, stats]) => ({
        pair,
        avgSL: stats.count > 0 ? parseFloat((stats.slSum / stats.count).toFixed(2)) : 0,
        avgTP: stats.count > 0 ? parseFloat((stats.tpSum / stats.count).toFixed(2)) : 0
      }))
      .sort((a, b) => a.pair.localeCompare(b.pair));
  }, [trades /*, date range state */]);

  // Compute total profit/loss by pair for all trades in date range (not filtered by selectedPair)
  const profitLossByPair = React.useMemo(() => {
    // Use only date range filter, not pair filter
    const tradesInRange = trades.filter(trade => isWithinRange(trade.date));
    const pairStats: Record<string, { profit: number; loss: number }> = {};
    tradesInRange.forEach(trade => {
      if (!pairStats[trade.pair]) pairStats[trade.pair] = { profit: 0, loss: 0 };
      if (trade.result >= 0) {
        pairStats[trade.pair].profit += trade.result;
      } else {
        pairStats[trade.pair].loss += Math.abs(trade.result);
      }
    });
    return Object.entries(pairStats)
      .map(([pair, stats]) => ({
        pair,
        profit: parseFloat(stats.profit.toFixed(2)),
        loss: parseFloat(stats.loss.toFixed(2)),
      }))
      .sort((a, b) => a.pair.localeCompare(b.pair));
  }, [trades, dateRange]);

  // Compute win rate by day of week for filteredTrades (respects pair selector)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const winRateByDay = React.useMemo(() => {
    const stats: Record<number, { wins: number; total: number }> = {};
    filteredTrades.forEach(trade => {
      const day = getDay(parseISO(trade.date));
      if (!stats[day]) stats[day] = { wins: 0, total: 0 };
      if (trade.outcome === 'win') stats[day].wins++;
      stats[day].total++;
    });
    return daysOfWeek.map((label, idx) => {
      const s = stats[idx] || { wins: 0, total: 0 };
      return {
        day: label,
        winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
      };
    });
  }, [filteredTrades]);

  // Helper to get date N days ago
  const getDateNDaysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  // Helper to get date N months ago
  const getDateNMonthsAgo = (n: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d.toISOString().slice(0, 10);
  };
  // Helper to get date N years ago
  const getDateNYearsAgo = (n: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - n);
    return d.toISOString().slice(0, 10);
  };
  // Helper to get quarter start
  const getQuarterStart = () => {
    const d = new Date();
    const q = Math.floor(d.getMonth() / 3);
    d.setMonth(q * 3, 1);
    return d.toISOString().slice(0, 10);
  };
  const getCardDateRange = (filter: typeof globalFilter) => {
    if (filter.mode === 'range') {
      return filter.range;
    }
    const today = new Date().toISOString().slice(0, 10);
    switch (filter.quick) {
      case 'week':
        return { start: getDateNDaysAgo(7), end: today };
      case 'month':
        return { start: getDateNMonthsAgo(1), end: today };
      case 'quarter':
        return { start: getQuarterStart(), end: today };
      case 'year':
        return { start: getDateNYearsAgo(1), end: today };
      default:
        return { start: '', end: '' };
    }
  };
  const getFiltered = (items: any[], filter: typeof globalFilter) => {
    const { start, end } = getCardDateRange(filter);
    return items.filter(item => {
      const date = new Date(item.date);
      if (start && date < new Date(start)) return false;
      if (end && date > new Date(end)) return false;
      return true;
    });
  };
  const pnlTrades = getFiltered(filteredTrades, globalFilter);
  const pnlValue = pnlTrades.reduce((sum, trade) => sum + trade.result, 0);
  const pnlCount = pnlTrades.length;
  const withdrawalItems = getFiltered(filteredWithdrawals, globalFilter);
  const withdrawalValue = withdrawalItems.reduce((sum, w) => sum + w.amount, 0);
  const winrateTrades = getFiltered(filteredTrades, globalFilter);
  const winrateTotal = winrateTrades.length;
  const winrateWins = winrateTrades.filter(t => t.outcome === 'win').length;
  const winrateLosses = winrateTrades.filter(t => t.outcome === 'loss').length;
  const winrateBE = winrateTrades.filter(t => t.outcome === 'BE').length;
  const winratePercent = winrateTotal > 0 ? Math.round((winrateWins / winrateTotal) * 100) : 0;

  // UI for global selectors
  const renderGlobalSelectors = () => (
    <div className="flex flex-row flex-wrap items-center gap-6 mb-4">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Trading Dashboard</h2>
      <div className="flex flex-row items-center gap-4 ml-4">
        <div className="flex items-center gap-2">
          <input type="radio" id="quick-radio-global" name="date-mode-global" checked={globalFilter.mode === 'quick'} onChange={() => setGlobalFilter(f => ({ ...f, mode: 'quick' }))} />
          <label htmlFor="quick-radio-global" className="text-xs text-slate-700 dark:text-slate-200">Quick Range</label>
          <select value={globalFilter.quick} onChange={e => setGlobalFilter(f => ({ ...f, quick: e.target.value }))} disabled={globalFilter.mode !== 'quick'}
            className="ml-1 px-1 py-0.5 text-xs border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors">
            <option value="all">All Time</option>
            <option value="week">1 Week</option>
            <option value="month">1 Month</option>
            <option value="quarter">1 Quarter</option>
            <option value="year">1 Year</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="radio" id="range-radio-global" name="date-mode-global" checked={globalFilter.mode === 'range'} onChange={() => setGlobalFilter(f => ({ ...f, mode: 'range' }))} />
          <label htmlFor="range-radio-global" className="text-xs text-slate-700 dark:text-slate-200">Date Range</label>
          {globalFilter.mode === 'range' && (
            <div className="flex items-center gap-1 ml-1">
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-slate-400" />
                <input type="date" value={globalFilter.range.start} onChange={e => setGlobalFilter(f => ({ ...f, range: { ...f.range, start: e.target.value } }))} className="px-1 py-0.5 text-xs border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors" />
              </span>
              <span className="mx-1">to</span>
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-slate-400" />
                <input type="date" value={globalFilter.range.end} onChange={e => setGlobalFilter(f => ({ ...f, range: { ...f.range, end: e.target.value } }))} className="px-1 py-0.5 text-xs border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Helper: Render selectors for modal
  const renderSelectors = () => (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
      <div className="flex-shrink-0">
        <div className="flex flex-col md:flex-row items-center gap-4 my-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Date Range:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
            className="border rounded px-2 py-1 dark:bg-slate-700 dark:text-slate-100"
            max={dateRange.end || undefined}
          />
          <span className="mx-2 text-slate-500 dark:text-slate-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
            className="border rounded px-2 py-1 dark:bg-slate-700 dark:text-slate-100"
            min={dateRange.start || undefined}
          />
          {(dateRange.start || dateRange.end) && (
            <button
              className="ml-2 text-xs text-red-500 hover:underline"
              onClick={() => setDateRange({ start: '', end: '' })}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <label htmlFor="pairSelectorModal" className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">Pair</label>
        <select
          id="pairSelectorModal"
          value={selectedPair}
          onChange={e => setSelectedPair(e.target.value)}
          className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
        >
          <option value="all">All Pairs</option>
          {PAIRS.map(pair => (
            <option key={pair} value={pair}>{pair}</option>
          ))}
        </select>
      </div>
    </div>
  );

  // Helper: Modal wrapper
  const ChartModal = ({ chartKey, children }: { chartKey: string, children: React.ReactNode }) => (
    expandedChart === chartKey ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-auto relative">
          <button
            className="absolute top-4 right-4 text-slate-500 hover:text-red-500 text-2xl font-bold"
            onClick={() => setExpandedChart(null)}
            aria-label="Close"
          >
            ×
          </button>
          {renderSelectors()}
          {children}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-6">
      {renderGlobalSelectors()}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance Card (first) */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl shadow-lg p-6 flex flex-col items-center border border-blue-100 dark:border-blue-700 transition-colors">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Current Balance</h3>
          <p className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">${user.currentBalance.toFixed(2)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Started with ${user.startingBalance.toFixed(2)}</p>
        </div>
        {/* Total P&L Card (second) */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl shadow-lg p-6 flex flex-col items-center border border-slate-200 dark:border-slate-700 transition-colors">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total P&amp;L</h3>
          <p className={`text-3xl font-extrabold ${pnlValue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{pnlValue >= 0 ? '+' : ''}{pnlValue.toFixed(2)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across {pnlCount} trades</p>
        </div>
        {/* Win Rate Card (third) */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl shadow-lg p-6 flex flex-col items-center border border-teal-100 dark:border-teal-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900">
              <svg className="w-4 h-4 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>
            </span>
            <span className="text-base font-semibold text-teal-700 dark:text-teal-300">Win Rate</span>
          </div>
          <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mb-1">{winRate}%</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {winTrades} wins, {lossTrades} losses, {beTrades} BE
          </p>
        </div>
        {/* ROI Card (last) */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-xl shadow-lg p-6 flex flex-col items-center border border-green-100 dark:border-green-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 dark:bg-green-900">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20V4m0 0l-6 6m6-6l6 6" /></svg>
            </span>
            <span className="text-base font-semibold text-green-700 dark:text-green-300">ROI</span>
          </div>
          <div className={`text-3xl font-extrabold ${parseFloat(roiPercent) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mb-1`}>{roiPercent}%</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            vs Starting Balance
          </p>
        </div>
      </div>

      {/* Recent Activity - Now at the top with full width */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg p-6 transition-colors">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Recent Activity</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          {[...filteredTrades, ...filteredWithdrawals]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // sort by date descending
            .slice(0, 10) // only keep the 10 most recent
            .map((item) => {
              const isTrade = 'direction' in item;
              return (
                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {isTrade
                        ? `${(item as any).pair} ${(item as any).direction} trade`
                        : 'Withdrawal'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{format(parseISO(item.date), 'MMM dd, yyyy')}</p>
                  </div>
                  <div className={`text-right ${
                    isTrade
                      ? (item as any).result > 0
                        ? 'text-green-600 dark:text-green-400'
                        : (item as any).result < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-700 dark:text-slate-300'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    <p className="text-sm font-medium">
                      {isTrade
                        ? ((item as any).result > 0 ? '+' : '') + (item as any).result.toFixed(2)
                        : '-' + (item as any).amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          {trades.length === 0 && withdrawals.length === 0 && (
            <p className="text-center text-slate-500 dark:text-slate-400 py-4">No activity yet</p>
          )}
        </div>
      </div>

      {/* Charts Filter Row */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center mb-6">
        {/* Date Range Picker (existing) */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Date Range:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
            className="border rounded px-2 py-1 dark:bg-slate-700 dark:text-slate-100"
            max={dateRange.end || undefined}
          />
          <span className="mx-2 text-slate-500 dark:text-slate-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
            className="border rounded px-2 py-1 dark:bg-slate-700 dark:text-slate-100"
            min={dateRange.start || undefined}
          />
          {(dateRange.start || dateRange.end) && (
            <button
              className="ml-2 text-xs text-red-500 hover:underline"
              onClick={() => setDateRange({ start: '', end: '' })}
            >
              Clear
            </button>
          )}
        </div>

        {/* Pair Selector (right) */}
        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="pairSelector" className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">Pair</label>
          <select
            id="pairSelector"
            value={selectedPair}
            onChange={e => setSelectedPair(e.target.value)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
          >
            <option value="all">All Pairs</option>
            {PAIRS.map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
        </div>

        {/* Timeframe Selector (new) */}
        <div className="flex items-center gap-2">
          <label htmlFor="timeframeSelector" className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">Timeframe</label>
          <select
            id="timeframeSelector"
            value={selectedTimeframe}
            onChange={e => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Timeframes</option>
            {allTimeframes.filter(tf => tf !== 'all').map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pie Charts Row: Trade Outcomes & Trades by Direction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trade Outcomes Pie Chart */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg p-6 transition-colors cursor-pointer" onClick={() => setExpandedChart('tradeOutcomes')}>
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Trade Outcomes</h3>
          {outcomeData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {outcomeData.map((entry) => (
                      <Cell key={entry.name} fill={
                        entry.name === 'Win' ? '#22C55E' : entry.name === 'Loss' ? '#EF4444' : '#FFBB28'
                      } />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }} formatter={(value) => [value, 'Trades']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400">No trade data available</p>
            </div>
          )}
        </div>
        {/* Trades by Direction Pie Chart */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg p-6 transition-colors cursor-pointer" onClick={() => setExpandedChart('tradesByDirection')}>
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Trades by Direction</h3>
          {filteredTrades.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={directionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell key="long" fill="#22C55E" />
                    <Cell key="short" fill="#EF4444" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }} formatter={(value) => [value, 'Trades']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400">No trade data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Line Charts Row: Balance History & Win Rate Over Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Balance History (Line Chart) */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg p-6 transition-colors cursor-pointer" onClick={() => setExpandedChart('balanceHistory')}>
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Balance History</h3>

          {balanceHistory.length > 1 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceHistory} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    className="dark:stroke-slate-400 dark:fill-slate-400"
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                    className="dark:stroke-slate-400 dark:fill-slate-400"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      color: '#0f172a'
                    }}
                    formatter={(value) => [`$${value}`, 'Balance']}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ stroke: '#0d9488', strokeWidth: 2, r: 4, fill: '#ffffff' }}
                    activeDot={{ stroke: '#0d9488', strokeWidth: 2, r: 6, fill: '#ffffff' }}
                    className="dark:stroke-teal-500 dark:fill-slate-900"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400">Not enough data to display chart</p>
            </div>
          )}
        </div>

        {/* Win Rate Over Time (Line Chart) */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg p-6 transition-colors cursor-pointer" onClick={() => setExpandedChart('winRateOverTime')}>
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Win Rate Over Time</h3>
          {filteredTrades.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={winRateHistory} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      color: '#0f172a'
                    }}
                    formatter={(value) => [`${value}%`, 'Win Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={{ stroke: '#22C55E', strokeWidth: 2, r: 4, fill: '#ffffff' }}
                    activeDot={{ stroke: '#22C55E', strokeWidth: 2, r: 6, fill: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400">Not enough data to display chart</p>
            </div>
          )}
        </div>
      </div>

      {/* Bar Charts Row: Days of Week Win Rate & Pairs with Highest Win Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Days of Week Win Rate (Bar Chart) */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Days of Week Win Rate</h3>
          {winRateByDay.some(d => d.winRate > 0) ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winRateByDay} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} formatter={v => [`${v}%`, 'Win Rate']} />
                  <Bar dataKey="winRate" fill="#22C55E" name="Win Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400">Not enough data to display chart</p>
            </div>
          )}
        </div>

        {/* Pairs with Highest Win Rate (Bar Chart, all pairs only) */}
        {selectedPair === 'all' && (
          <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg p-6 transition-colors">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Pairs with Highest Win Rate</h3>
            {winRateByPair.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={winRateByPair}
                    margin={{ top: 5, right: 20, bottom: 5, left: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={value => `${value}%`}
                      stroke="#64748b"
                    />
                    <YAxis
                      dataKey="pair"
                      type="category"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      stroke="#64748b"
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        color: '#0f172a'
                      }}
                      formatter={value => [`${value}%`, 'Win Rate']}
                    />
                    <Bar dataKey="winRate" fill="#22C55E" name="Win Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <p className="text-slate-500 dark:text-slate-400">Not enough data to display chart</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Average SL and TP by Pair (Bar Chart, all pairs only) */}
      {selectedPair === 'all' && (
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Average SL and TP (Pips) by Pair</h3>
          {avgSLTPByPair.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={avgSLTPByPair}
                  margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="pair"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="#64748b"
                    label={{ value: 'Pips', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 14 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      color: '#0f172a'
                    }}
                    formatter={(value, name) => [value, name === 'avgSL' ? 'Avg SL' : 'Avg TP']}
                  />
                  <Legend />
                  <Bar dataKey="avgSL" fill="#EF4444" name="Average SL (Pips)" />
                  <Bar dataKey="avgTP" fill="#22C55E" name="Average TP (Pips)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400">Not enough data to display chart</p>
            </div>
          )}
        </div>
      )}

      {/* Total Profit/Loss by Pair (Bar Chart, full width, all pairs only) */}
      {selectedPair === 'all' && (
        <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">Total Profit/Loss by Pair</h3>
          {profitLossByPair.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={profitLossByPair}
                  margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="pair"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    stroke="#64748b"
                    label={{ value: 'Profit/Loss ($)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 14 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      color: '#0f172a'
                    }}
                    formatter={(value, name) => [value, name === 'profit' ? 'Profit' : 'Loss']}
                  />
                  <Legend />
                  <Bar dataKey="profit" fill="#22C55E" name="Profit ($)" />
                  <Bar dataKey="loss" fill="#EF4444" name="Loss ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400">Not enough data to display chart</p>
            </div>
          )}
        </div>
      )}

      {/* SL Hit vs TP Hit (Bar Chart, full width, individual pair only) */}
      {selectedPair !== 'all' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">SL Hit vs TP Hit (Count)</h3>
          {/* ...existing SL Hit vs TP Hit chart code... */}
        </div>
      )}

      {/* Modals for expanded charts */}
      <ChartModal chartKey="tradeOutcomes">
        {/* Trade Outcomes chart code (repeat from above) */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={outcomeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {outcomeData.map((entry) => (
                  <Cell key={entry.name} fill={
                    entry.name === 'Win' ? '#22C55E' : entry.name === 'Loss' ? '#EF4444' : '#FFBB28'
                  } />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }} formatter={(value) => [value, 'Trades']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>

      <ChartModal chartKey="tradesByDirection">
        {/* Trades by Direction chart code (repeat from above) */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={directionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                <Cell key="long" fill="#22C55E" />
                <Cell key="short" fill="#EF4444" />
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a' }} formatter={(value) => [value, 'Trades']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>

      <ChartModal chartKey="balanceHistory">
        {/* Balance History chart code (repeat from above) */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceHistory} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                className="dark:stroke-slate-400 dark:fill-slate-400"
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
                className="dark:stroke-slate-400 dark:fill-slate-400"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  color: '#0f172a'
                }}
                formatter={(value) => [`$${value}`, 'Balance']}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#0d9488"
                strokeWidth={2}
                dot={{ stroke: '#0d9488', strokeWidth: 2, r: 4, fill: '#ffffff' }}
                activeDot={{ stroke: '#0d9488', strokeWidth: 2, r: 6, fill: '#ffffff' }}
                className="dark:stroke-teal-500 dark:fill-slate-900"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>

      <ChartModal chartKey="winRateOverTime">
        {/* Win Rate Over Time chart code (repeat from above) */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={winRateHistory} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  color: '#0f172a'
                }}
                formatter={(value) => [`${value}%`, 'Win Rate']}
              />
              <Line
                type="monotone"
                dataKey="winRate"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ stroke: '#22C55E', strokeWidth: 2, r: 4, fill: '#ffffff' }}
                activeDot={{ stroke: '#22C55E', strokeWidth: 2, r: 6, fill: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartModal>

      {/* Edit Starting Balance Modal */}
      <EditStartingBalanceModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        currentStartingBalance={user.startingBalance}
      />
    </div>
  );
};
