import React from 'react';
import { useForm } from 'react-hook-form';
import { useWithdrawalStore } from '../store/withdrawalStore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

interface WithdrawalFormData {
  date: string;
  amount: number;
  remarks?: string;
}

export const WithdrawalForm: React.FC = () => {
  const { user } = useAuthStore();
  const { addWithdrawal, isLoading, error } = useWithdrawalStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WithdrawalFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  const onSubmit = async (data: WithdrawalFormData) => {
    await addWithdrawal(
      data.date,
      data.amount,
      data.remarks
    );

    // Reset form after successful submission
    if (!error) {
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg shadow-lg p-6 transition-colors">
      <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Withdraw Funds</h2>

      <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 dark:text-slate-300">Current Balance:</span>
          <span className="text-xl font-semibold text-teal-600 dark:text-teal-400">
            ${user.currentBalance.toFixed(2)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Date */}
        <div>
          <label htmlFor="withdrawalDate" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Date
          </label>
          <input
            id="withdrawalDate"
            type="date"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('date', { required: 'Date is required' })}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-400">{errors.date.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Withdrawal Amount ($)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            placeholder="500.00"
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('amount', {
              required: 'Amount is required',
              min: {
                value: 1,
                message: 'Amount must be at least $1'
              },
              max: {
                value: user.currentBalance,
                message: `Amount cannot exceed current balance of $${user.currentBalance.toFixed(2)}`
              }
            })}
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-400">{errors.amount.message}</p>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label htmlFor="withdrawalRemarks" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            Remarks
          </label>
          <textarea
            id="withdrawalRemarks"
            rows={3}
            placeholder="Reason for withdrawal, destination, etc."
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-100 transition-colors"
            {...register('remarks')}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-md">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-md font-medium transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Withdraw Funds'}
        </button>
      </form>
    </div>
  );
};