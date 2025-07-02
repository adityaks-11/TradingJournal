import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  type: string;
  created_at: string;
}

interface StrategyState {
  strategies: Strategy[];
  isLoading: boolean;
  error: string | null;
  fetchStrategies: () => Promise<void>;
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
  strategies: [],
  isLoading: false,
  error: null,
  fetchStrategies: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      set({ strategies: data || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
