import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Trade, TradeDirection, TradeOutcome } from '../types';
import { useAuthStore } from './authStore';

interface TradeState {
  trades: Trade[];
  isLoading: boolean;
  error: string | null;
  fetchTrades: () => Promise<void>;
  addTrade: (trade: {
    date: string;
    pair: string;
    session: string;
    direction: TradeDirection;
    slPips: number;
    tpPips: number;
    riskRewardRatio: number;
    outcome: TradeOutcome;
    result: number;
    imageLink?: string;
    remarks?: string;
    timeframe: string;
    account: string; // Added
    strategy_name: string; // Added
  }) => Promise<void>;
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
      const formattedTrades: Trade[] = (data || []).map((trade: any) => ({
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
        timeframe: trade.timeframe,
        imageLink: trade.image_link || undefined,
        remarks: trade.remarks || undefined,
        account: trade.account,
        strategy: trade.strategy,
        strategy_name: trade.strategy_name, // <-- ensure this is mapped
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

  addTrade: async (trade) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('trades')
        .insert([
          {
            user_id: user.id,
            date: trade.date,
            pair: trade.pair,
            session: trade.session,
            direction: trade.direction,
            sl_pips: trade.slPips,
            tp_pips: trade.tpPips,
            risk_reward_ratio: trade.riskRewardRatio,
            outcome: trade.outcome,
            result: trade.result,
            timeframe: trade.timeframe,
            image_link: trade.imageLink,
            remarks: trade.remarks,
            account: trade.account,
            strategy_name: trade.strategy_name,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      if (!data || typeof data !== 'object' || Array.isArray(data) || !('id' in data)) throw new Error('No valid data returned from insert');
      // Type assertion to fix TS errors
      const row = data as any; // Replace 'any' with your Supabase trade row type if available
      const newTrade: Trade = {
        id: row.id,
        userId: row.user_id,
        date: row.date,
        pair: row.pair,
        session: row.session,
        direction: row.direction,
        slPips: row.sl_pips,
        tpPips: row.tp_pips,
        riskRewardRatio: row.risk_reward_ratio,
        outcome: row.outcome,
        result: row.result,
        timeframe: row.timeframe,
        imageLink: row.image_link || undefined,
        remarks: row.remarks || undefined,
        account: row.account,
        strategy_name: row.strategy_name,
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