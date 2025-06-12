import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Trade, TradeDirection, TradeOutcome } from '../types';
import { useAuthStore } from './authStore';

interface TradeState {
  trades: Trade[];
  isLoading: boolean;
  error: string | null;

  fetchTrades: () => Promise<void>;
  addTrade: (
    date: string,
    pair: string,
    session: string,
    direction: TradeDirection,
    slPips: number,
    tpPips: number,
    riskRewardRatio: number,
    outcome: TradeOutcome,
    result: number,
    imageLink?: string,
    remarks?: string
  ) => Promise<void>;
  deleteTrade: (tradeId: string) => Promise<void>;
  deleteAllTrades: () => Promise<void>;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],
  isLoading: false,
  error: null,

  fetchTrades: async () => {
    try {
      const user = useAuthStore.getState().user;

      if (!user) throw new Error('User not authenticated');

      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedTrades: Trade[] = data.map((trade) => ({
        id: trade.id,
        userId: trade.user_id,
        date: trade.date,
        pair: trade.pair,
        session: trade.session,
        direction: trade.direction,
        slPips: trade.sl_pips,
        tpPips: trade.tp_pips,
        riskRewardRatio: trade.risk_reward_ratio,
        outcome: trade.outcome,
        result: trade.result,
        balanceAfterTrade: trade.balance_after_trade,
        imageLink: trade.image_link || undefined,
        remarks: trade.remarks || undefined,
      }));

      set({ trades: formattedTrades });
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

  addTrade: async (
    date,
    pair,
    session,
    direction,
    slPips,
    tpPips,
    riskRewardRatio,
    outcome,
    result,
    imageLink,
    remarks
  ) => {
    try {
      const user = useAuthStore.getState().user;

      if (!user) throw new Error('User not authenticated');

      set({ isLoading: true, error: null });

      // Ensure currentBalance and result are numbers
      const currentBalance = typeof user.currentBalance === 'number'
        ? user.currentBalance
        : parseFloat(String(user.currentBalance));

      const numericResult = typeof result === 'number'
        ? result
        : parseFloat(String(result));

      if (isNaN(currentBalance) || isNaN(numericResult)) {
        throw new Error('Invalid balance or result value');
      }

      console.log('Current balance:', currentBalance, 'Result:', numericResult);
      const newBalance = currentBalance + numericResult;

      const { data, error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          date,
          pair,
          session,
          direction,
          sl_pips: slPips,
          tp_pips: tpPips,
          risk_reward_ratio: riskRewardRatio,
          outcome,
          result,
          balance_after_trade: newBalance,
          image_link: imageLink,
          remarks,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user balance
      await useAuthStore.getState().updateBalance(newBalance);

      const newTrade: Trade = {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        pair: data.pair,
        session: data.session,
        direction: data.direction,
        slPips: data.sl_pips,
        tpPips: data.tp_pips,
        riskRewardRatio: data.risk_reward_ratio,
        outcome: data.outcome,
        result: data.result,
        balanceAfterTrade: data.balance_after_trade,
        imageLink: data.image_link || undefined,
        remarks: data.remarks || undefined,
      };

      set({ trades: [newTrade, ...get().trades] });
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

  deleteTrade: async (tradeId) => {
    try {
      const user = useAuthStore.getState().user;

      if (!user) throw new Error('User not authenticated');

      set({ isLoading: true, error: null });

      // Find the trade to be deleted
      const tradeToDelete = get().trades.find(trade => trade.id === tradeId);

      if (!tradeToDelete) {
        throw new Error('Trade not found');
      }

      // Delete the trade from the database
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;

      // Calculate the new balance
      // If it was a profitable trade (positive result), subtract that amount
      // If it was a loss (negative result), add that amount back
      const currentBalance = user.currentBalance;
      const tradeResult = tradeToDelete.result;
      const newBalance = currentBalance - tradeResult;

      // Update the user's balance
      await useAuthStore.getState().updateBalance(newBalance);

      // Update the local state
      set({
        trades: get().trades.filter(trade => trade.id !== tradeId)
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

  deleteAllTrades: async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');
      // Delete all trades for this user
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id as any);
      if (error) throw error;
      // Reset balance to starting balance
      await useAuthStore.getState().updateBalance(user.startingBalance);
      // Clear local trades
      set({ trades: [] });
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