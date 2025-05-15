import React, { useEffect } from 'react';
import { useWithdrawalStore } from '../store/withdrawalStore';
import { format, parseISO } from 'date-fns';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const WithdrawalHistory: React.FC = () => {
  const { withdrawals, fetchWithdrawals, isLoading, error } = useWithdrawalStore();
  
  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);
  
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
      <div className="bg-slate-800 rounded-lg shadow-lg p-8 text-center">
        <p className="text-lg text-slate-300">No withdrawals recorded yet.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
      <h2 className="text-xl font-semibold p-6 border-b border-slate-700">Withdrawal History</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Balance Before</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Balance After</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {withdrawals.map((withdrawal) => (
              <tr key={withdrawal.id} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 text-sm">{format(parseISO(withdrawal.date), 'MMM dd, yyyy')}</td>
                <td className="px-4 py-3 text-sm font-medium text-red-400">-${withdrawal.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">${withdrawal.balanceBefore.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">${withdrawal.balanceAfter.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">
                  {withdrawal.remarks || <span className="text-slate-500">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};