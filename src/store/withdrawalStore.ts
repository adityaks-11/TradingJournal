import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Withdrawal } from '../types';
import { useAuthStore } from './authStore';

interface WithdrawalState {
  withdrawals: Withdrawal[];
  isLoading: boolean;
  error: string | null;

  fetchWithdrawals: () => Promise<void>;
  addWithdrawal: (
    date: string,
    amount: number,
    remarks?: string
  ) => Promise<void>;
}

export const useWithdrawalStore = create<WithdrawalState>((set, get) => ({
  withdrawals: [],
  isLoading: false,
  error: null,

  fetchWithdrawals: async () => {
    try {
      const user = useAuthStore.getState().user;

      if (!user) throw new Error('User not authenticated');

      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedWithdrawals: Withdrawal[] = data.map((withdrawal) => ({
        id: withdrawal.id,
        userId: withdrawal.user_id,
        date: withdrawal.date,
        amount: withdrawal.amount,
        balanceBefore: withdrawal.balance_before,
        balanceAfter: withdrawal.balance_after,
        remarks: withdrawal.remarks || undefined,
      }));

      set({ withdrawals: formattedWithdrawals });
    } catch (error) {
      if (error instanceof Error) {
        set({ error: error.message });
      } else {
        set({ error: 'An unknown error occurred' });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  addWithdrawal: async (date, amount, remarks) => {
    try {
      const user = useAuthStore.getState().user;

      if (!user) throw new Error('User not authenticated');

      // Ensure currentBalance and amount are numbers
      const currentBalance = typeof user.currentBalance === 'number'
        ? user.currentBalance
        : parseFloat(String(user.currentBalance));

      const numericAmount = typeof amount === 'number'
        ? amount
        : parseFloat(String(amount));

      if (isNaN(currentBalance) || isNaN(numericAmount)) {
        throw new Error('Invalid balance or amount value');
      }

      if (numericAmount > currentBalance) {
        throw new Error('Withdrawal amount exceeds current balance');
      }

      set({ isLoading: true, error: null });

      const balanceBefore = currentBalance;
      const balanceAfter = balanceBefore - numericAmount;

      const { data, error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          date,
          amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          remarks,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user balance
      await useAuthStore.getState().updateBalance(balanceAfter);

      const newWithdrawal: Withdrawal = {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        amount: data.amount,
        balanceBefore: data.balance_before,
        balanceAfter: data.balance_after,
        remarks: data.remarks || undefined,
      };

      set({ withdrawals: [newWithdrawal, ...get().withdrawals] });
    } catch (error) {
      if (error instanceof Error) {
        set({ error: error.message });
      } else {
        set({ error: 'An unknown error occurred' });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));