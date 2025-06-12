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
  deleteWithdrawal: (withdrawalId: string) => Promise<void>;
  deleteAllWithdrawals: () => Promise<void>;
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
        .eq('user_id', user.id as any)
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

  deleteWithdrawal: async (withdrawalId) => {
    try {
      const user = useAuthStore.getState().user;

      if (!user) throw new Error('User not authenticated');

      set({ isLoading: true, error: null });

      // Find the withdrawal to be deleted
      const withdrawalToDelete = get().withdrawals.find(withdrawal => withdrawal.id === withdrawalId);

      if (!withdrawalToDelete) {
        throw new Error('Withdrawal not found');
      }

      // Delete the withdrawal from the database
      const { error } = await supabase
        .from('withdrawals')
        .delete()
        .eq('id', withdrawalId as any);

      if (error) throw error;

      // Calculate the new balance by adding the withdrawal amount back
      const currentBalance = user.currentBalance;
      const withdrawalAmount = withdrawalToDelete.amount;
      const newBalance = currentBalance + withdrawalAmount;

      // Update the user's balance
      await useAuthStore.getState().updateBalance(newBalance);

      // Update the local state
      set({
        withdrawals: get().withdrawals.filter(withdrawal => withdrawal.id !== withdrawalId)
      });
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

  deleteAllWithdrawals: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');
      // Calculate total withdrawal amount
      const totalWithdrawals = get().withdrawals.reduce((sum, w) => sum + w.amount, 0);
      // Delete all withdrawals for this user
      const { error } = await supabase
        .from('withdrawals')
        .delete()
        .eq('user_id', user.id as any);
      if (error) throw error;
      // Add back all withdrawal amounts to current balance
      await useAuthStore.getState().updateBalance(user.currentBalance + totalWithdrawals);
      // Clear local withdrawals
      set({ withdrawals: [] });
    } catch (error) {
      if (error instanceof Error) {
        set({ error: error.message });
        throw error;
      } else {
        set({ error: 'An unknown error occurred' });
        throw new Error('An unknown error occurred');
      }
    }
  },
}));