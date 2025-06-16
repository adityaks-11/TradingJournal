import React, { useEffect, useState } from 'react';
import { useWithdrawalStore } from '../store/withdrawalStore';
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Toast, ToastType } from './ui/Toast';
import { useAuthStore } from '../store/authStore';
import { saveAs } from 'file-saver';

export const WithdrawalHistory: React.FC = () => {
  const { withdrawals, fetchWithdrawals, deleteWithdrawal, isLoading, error, deleteAllWithdrawals } = useWithdrawalStore();
  const { user, updateBalance } = useAuthStore();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [withdrawalToDelete, setWithdrawalToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'info',
    message: '',
    isVisible: false
  });
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleDeleteClick = (withdrawalId: string) => {
    setWithdrawalToDelete(withdrawalId);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!withdrawalToDelete) return;

    try {
      await deleteWithdrawal(withdrawalToDelete);
      setToast({
        type: 'success',
        message: 'Withdrawal deleted successfully. Balance has been updated.',
        isVisible: true
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the withdrawal';
      setToast({
        type: 'error',
        message: errorMessage,
        isVisible: true
      });
    } finally {
      setIsConfirmDialogOpen(false);
      setWithdrawalToDelete(null);
    }
  };

  // Handler for deleting all withdrawals
  const handleDeleteAll = async () => {
    try {
      await deleteAllWithdrawals();
      setToast({
        type: 'success',
        message: 'All withdrawals deleted. Amounts added back to balance.',
        isVisible: true
      });
      fetchWithdrawals();
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to delete all withdrawals.',
        isVisible: true
      });
    } finally {
      setIsDeleteAllDialogOpen(false);
    }
  };

  // Export withdrawals to CSV
  const handleExportCSV = () => {
    if (!withdrawals.length) return;
    const headers = [
      'Date', 'Amount', 'Balance Before', 'Balance After', 'Remarks'
    ];
    const rows = withdrawals.map(w => [
      w.date,
      w.amount,
      w.balanceBefore,
      w.balanceAfter,
      w.remarks || ''
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `withdrawal_history_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  if (isLoading && withdrawals.length === 0) {
    return (
      <div className="flex justify-center p-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded-md">
        <p className="text-sm text-red-200">Error loading withdrawals: {error}</p>
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center transition-colors">
        <p className="text-lg text-slate-700 dark:text-slate-300">No withdrawals recorded yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg overflow-hidden transition-colors">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Withdrawal History</h2>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium transition-colors"
              onClick={handleExportCSV}
              disabled={withdrawals.length === 0}
            >
              Export to CSV
            </button>
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
              onClick={() => setIsDeleteAllDialogOpen(true)}
              disabled={isLoading || withdrawals.length === 0}
            >
              Delete All Withdrawals
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700 transition-colors">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Balance Before</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Balance After</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Remarks</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 transition-colors">
                  <td className="px-4 py-3 text-sm">{format(parseISO(withdrawal.date), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">-${withdrawal.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">${withdrawal.balanceBefore.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">${withdrawal.balanceAfter.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">
                    {withdrawal.remarks || <span className="text-slate-400 dark:text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleDeleteClick(withdrawal.id)}
                      className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                      title="Delete withdrawal"
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
        title="Delete Withdrawal"
        message="Are you sure you want to delete this withdrawal? This will add the amount back to your current balance and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Confirm Delete All Dialog */}
      <ConfirmDialog
        isOpen={isDeleteAllDialogOpen}
        onClose={() => setIsDeleteAllDialogOpen(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Withdrawals"
        message="Are you sure you want to delete ALL withdrawals? This will add all withdrawal amounts back to your balance and cannot be undone."
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
    </>
  );
};