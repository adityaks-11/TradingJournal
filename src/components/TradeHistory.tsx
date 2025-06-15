import React, { useEffect, useState } from 'react';
import { useTradeStore } from '../store/tradeStore';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, TrendingDown, ExternalLink, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Toast, ToastType } from './ui/Toast';
import { useAuthStore } from '../store/authStore';
import { saveAs } from 'file-saver';
import { Modal } from './ui/Modal';

export const TradeHistory: React.FC = () => {
  const { trades, fetchTrades, deleteTrade, isLoading, error, deleteAllTrades } = useTradeStore();
  const { user, updateBalance } = useAuthStore();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'info',
    message: '',
    isVisible: false
  });

  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'result'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedPair, setSelectedPair] = useState('all');

  // Export dialog state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState(selectedMonth);
  const [exportPair, setExportPair] = useState(selectedPair);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Always reset to latest date first on mount
  useEffect(() => {
    setSortBy('date');
    setSortOrder('desc');
  }, []);

  // Sorting logic
  const sortedTrades = [...trades].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else if (sortBy === 'result') {
      return sortOrder === 'desc' ? b.result - a.result : a.result - b.result;
    }
    return 0;
  });

  // Get all unique months from trades
  const months = Array.from(new Set(trades.map(trade => trade.date.slice(0, 7)))).sort().reverse();

  // Filter trades by month and pair
  const filteredTrades = sortedTrades.filter(trade => {
    const monthMatch = selectedMonth === 'all' || trade.date.startsWith(selectedMonth);
    const pairMatch = selectedPair === 'all' || trade.pair === selectedPair;
    return monthMatch && pairMatch;
  });

  const handleDeleteClick = (tradeId: string) => {
    setTradeToDelete(tradeId);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tradeToDelete) return;

    try {
      await deleteTrade(tradeToDelete);
      setToast({
        type: 'success',
        message: 'Trade deleted successfully. Balance has been updated.',
        isVisible: true
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the trade';
      setToast({
        type: 'error',
        message: errorMessage,
        isVisible: true
      });
    } finally {
      setIsConfirmDialogOpen(false);
      setTradeToDelete(null);
    }
  };

  // Handler for deleting all trades
  const handleDeleteAll = async () => {
    try {
      await deleteAllTrades();
      if (user) {
        await updateBalance(user.startingBalance);
      }
      setToast({
        type: 'success',
        message: 'All trade history deleted. Balance reset to starting balance.',
        isVisible: true
      });
      fetchTrades();
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to delete all trade history.',
        isVisible: true
      });
    } finally {
      setIsDeleteAllDialogOpen(false);
    }
  };

  // Export trades to CSV (filtered by exportMonth/exportPair)
  const handleExportCSV = () => {
    setExportMonth(selectedMonth);
    setExportPair(selectedPair);
    setIsExportDialogOpen(true);
  };

  const doExportCSV = () => {
    // Filter trades for export
    const tradesToExport = sortedTrades.filter(trade => {
      const monthMatch = exportMonth === 'all' || trade.date.startsWith(exportMonth);
      const pairMatch = exportPair === 'all' || trade.pair === exportPair;
      return monthMatch && pairMatch;
    });
    if (!tradesToExport.length) {
      setToast({ type: 'info', message: 'No trades to export for selected filters.', isVisible: true });
      setIsExportDialogOpen(false);
      return;
    }
    const headers = [
      'Date', 'Pair', 'Direction', 'SL Pips', 'TP Pips', 'RR', 'Outcome', 'Result', 'Balance After', 'Image Link', 'Remarks'
    ];
    const rows = tradesToExport.map(trade => [
      trade.date,
      trade.pair,
      trade.direction,
      trade.slPips,
      trade.tpPips,
      trade.riskRewardRatio,
      trade.outcome,
      trade.result,
      trade.balanceAfterTrade,
      trade.imageLink || '',
      trade.remarks || ''
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    // Filename logic
    let monthLabel = 'AllTime';
    if (exportMonth !== 'all') {
      try {
        monthLabel = format(parseISO(exportMonth + '-01'), 'MMMM_yyyy');
      } catch { monthLabel = exportMonth; }
    }
    let pairLabel = exportPair === 'all' ? 'AllPairs' : exportPair;
    saveAs(blob, `trade_history_${monthLabel}_${pairLabel}.csv`);
    setIsExportDialogOpen(false);
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

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
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center transition-colors">
        <p className="text-lg text-slate-700 dark:text-slate-300">No trades recorded yet.</p>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Add your first trade to start tracking your performance!</p>
      </div>
    );
  }

  // List of all pairs for dropdown
  const PAIRS = [
    'all',
    'XAUUSD', 'GBPUSD',
    'GBPJPY', 'AUDUSD', 'AUDJPY', 'CADJPY', 'EURGBP', 'USDJPY', 'USDCAD',
    'EURUSD', 'EURCHF'
  ];

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Trading History</h2>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Time</option>
              {months.map(month => (
                <option key={month} value={month}>{format(parseISO(month + '-01'), 'MMMM yyyy')}</option>
              ))}
            </select>
            <select
              value={selectedPair}
              onChange={e => setSelectedPair(e.target.value)}
              className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Pairs</option>
              {PAIRS.filter(p => p !== 'all').map(pair => (
                <option key={pair} value={pair}>{pair}</option>
              ))}
            </select>
            <button
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium transition-colors"
              onClick={handleExportCSV}
              disabled={trades.length === 0}
            >
              Export to CSV
            </button>
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
              onClick={() => setIsDeleteAllDialogOpen(true)}
              disabled={isLoading || trades.length === 0}
            >
              Delete All History
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700 transition-colors">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none flex items-center gap-1"
                    onClick={() => {
                      if (sortBy === 'date') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                      else { setSortBy('date'); setSortOrder('desc'); }
                    }}
                >
                  Date
                  <span className="ml-1 opacity-50">
                    {sortBy === 'date' ? (
                      sortOrder === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />
                    ) : (
                      <ArrowDown size={16} />
                    )}
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Pair</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Direction</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">SL/TP (Pips)</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">RR</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Outcome</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none flex items-center gap-1"
                    onClick={() => {
                      if (sortBy === 'result') setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                      else { setSortBy('result'); setSortOrder('desc'); }
                    }}
                >
                  Result
                  <span className="ml-1 opacity-50">
                    {sortBy === 'result' ? (
                      sortOrder === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />
                    ) : (
                      <ArrowDown size={16} />
                    )}
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Balance After</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Image</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Remarks</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors">
                  <td className="px-4 py-3 text-sm">{format(parseISO(trade.date), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-3 text-sm">{trade.pair}</td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      trade.direction === 'long'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
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
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : trade.outcome === 'loss'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
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
                      ? 'text-green-600 dark:text-green-400'
                      : trade.result < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-700 dark:text-slate-300'
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
                        className="text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 inline-flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink size={14} />
                        View
                      </a>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {trade.remarks ? (
                      <span>{trade.remarks}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleDeleteClick(trade.id)}
                      className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                      title="Delete trade"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? This will update your current balance and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Confirm Delete All Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllDialogOpen}
        onClose={() => setIsDeleteAllDialogOpen(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Trade History"
        message="Are you sure you want to delete ALL trade history? This will reset your balance to your starting balance and cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
      />

      {/* Toast Notification */}
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />

      {/* Export Dialog */}
      <Modal isOpen={isExportDialogOpen} onClose={() => setIsExportDialogOpen(false)} title="Export to CSV" size="sm">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <select
              value={exportMonth}
              onChange={e => setExportMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Time</option>
              {months.map(month => (
                <option key={month} value={month}>{format(parseISO(month + '-01'), 'MMMM yyyy')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pair</label>
            <select
              value={exportPair}
              onChange={e => setExportPair(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Pairs</option>
              {PAIRS.filter(p => p !== 'all').map(pair => (
                <option key={pair} value={pair}>{pair}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-md" onClick={() => setIsExportDialogOpen(false)}>Cancel</button>
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium" onClick={doExportCSV}>Export</button>
          </div>
        </div>
      </Modal>
    </>
  );
};