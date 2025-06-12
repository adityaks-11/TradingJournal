import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signupSuccess: boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, startingBalance: number) => Promise<void>;
  logout: () => Promise<void>;
  getUser: () => Promise<void>;

  // Balance actions
  updateBalance: (newBalance: number) => Promise<void>;
  updateStartingBalance: (newStartingBalance: number) => Promise<number>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  signupSuccess: false,

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      console.log('Attempting login for:', email);

      // First, sign out to clear any existing sessions
      await supabase.auth.signOut();

      // Sign in with password
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message === 'Email not confirmed') {
          throw new Error('Please check your email and confirm your account before signing in.');
        }
        throw error;
      }

      // Verify we have a session and user
      if (!authData?.session || !authData?.user) {
        console.error('No session or user in auth data');
        throw new Error('Authentication failed. Please try again.');
      }

      console.log('Authentication successful, user ID:', authData.user.id);

      // Set the session explicitly
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      console.log('Session set successfully');

      // Small delay to ensure session is properly set
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get user data
      await get().getUser();
    } catch (error) {
      console.error('Login catch block:', error);
      if (error instanceof Error) {
        set({ error: error.message });
      } else {
        set({ error: 'An unknown error occurred' });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (email, password, startingBalance) => {
    try {
      set({ isLoading: true, error: null, signupSuccess: false });

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user?.id) {
        throw new Error('Failed to create user account');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          starting_balance: startingBalance,
          current_balance: startingBalance,
        })
        .select()
        .single();

      if (profileError) {
        throw new Error('Failed to create user profile. Please try again.');
      }

      set({ signupSuccess: true });
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

  logout: async () => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      set({ user: null });
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

  getUser: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      console.log('Authenticated user found:', user.id);

      try {
        // Use a simpler query approach with filter
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .filter('id', 'eq', user.id);

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }

        // Check if we got any results
        if (!data || data.length === 0) {
          console.log('No profile found, attempting to create one');

          // Create a profile if none exists
          const { data: newProfileData, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              starting_balance: 0,
              current_balance: 0,
            })
            .select('*')
            .single();

          if (createError) {
            console.error('Profile creation error:', createError);
            throw new Error('Failed to create user profile. Please try again.');
          }

          if (newProfileData) {
            console.log('New profile created successfully');
            // Ensure numeric values
            const startingBalance = typeof newProfileData.starting_balance === 'number'
              ? newProfileData.starting_balance
              : parseFloat(String(newProfileData.starting_balance));

            const currentBalance = typeof newProfileData.current_balance === 'number'
              ? newProfileData.current_balance
              : parseFloat(String(newProfileData.current_balance));

            set({
              user: {
                id: newProfileData.id,
                email: newProfileData.email,
                startingBalance: startingBalance,
                currentBalance: currentBalance,
              },
            });
          }
        } else {
          // Use the first profile found
          const profile = data[0];
          console.log('Profile found:', profile.id);

          // Ensure numeric values
          const startingBalance = typeof profile.starting_balance === 'number'
            ? profile.starting_balance
            : parseFloat(String(profile.starting_balance));

          const currentBalance = typeof profile.current_balance === 'number'
            ? profile.current_balance
            : parseFloat(String(profile.current_balance));

          console.log('Profile data:', {
            id: profile.id,
            email: profile.email,
            startingBalance: startingBalance,
            currentBalance: currentBalance,
            rawCurrentBalance: profile.current_balance,
            type: typeof profile.current_balance
          });

          set({
            user: {
              id: profile.id,
              email: profile.email,
              startingBalance: startingBalance,
              currentBalance: currentBalance,
            },
          });
        }
      } catch (profileError) {
        console.error('Profile fetch/create catch block:', profileError);
        throw profileError;
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (error instanceof Error) {
        set({ error: error.message });
      } else {
        set({ error: 'An unknown error occurred' });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateBalance: async (newBalance) => {
    try {
      const { user } = get();

      if (!user) throw new Error('User not authenticated');

      // Ensure newBalance is a number
      const numericBalance = typeof newBalance === 'number'
        ? newBalance
        : parseFloat(String(newBalance));

      if (isNaN(numericBalance)) {
        throw new Error('Invalid balance value');
      }

      console.log('Updating balance to:', numericBalance);
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('profiles')
        .update({ current_balance: numericBalance })
        .eq('id', user.id);

      if (error) throw error;

      set({ user: { ...user, currentBalance: numericBalance } });
    } catch (error) {
      console.error('Update balance error:', error);
      if (error instanceof Error) {
        set({ error: error.message });
      } else {
        set({ error: 'An unknown error occurred' });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateStartingBalance: async (newStartingBalance) => {
    try {
      const { user } = get();

      // Check if user is authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get trades and withdrawals
      const { trades } = await import('../store/tradeStore').then(m => m.useTradeStore.getState());
      const { withdrawals } = await import('../store/withdrawalStore').then(m => m.useWithdrawalStore.getState());

      // Ensure newStartingBalance is a valid number
      let numericStartingBalance: number;

      console.log('Raw starting balance value received:', newStartingBalance);
      console.log('Type of newStartingBalance:', typeof newStartingBalance);

      if (typeof newStartingBalance === 'number') {
        numericStartingBalance = newStartingBalance;
      } else if (typeof newStartingBalance === 'string') {
        try {
          const trimmedValue = newStartingBalance.trim();
          if (!trimmedValue) {
            throw new Error('Starting balance cannot be empty');
          }
          numericStartingBalance = parseFloat(trimmedValue);
        } catch (e) {
          throw new Error('Invalid starting balance format');
        }
      } else {
        throw new Error('Invalid starting balance type');
      }

      console.log('Parsed starting balance:', numericStartingBalance);

      // Validate the parsed value
      if (isNaN(numericStartingBalance)) {
        throw new Error('Invalid starting balance amount');
      }

      if (numericStartingBalance < 0) {
        throw new Error('Starting balance cannot be negative');
      }

      if (numericStartingBalance > 1000000000) {
        throw new Error('Starting balance amount is too large');
      }

      // Round to 2 decimal places to avoid floating point issues
      numericStartingBalance = Math.round(numericStartingBalance * 100) / 100;

      console.log('Updating starting balance to:', numericStartingBalance);
      set({ isLoading: true, error: null });

      // Calculate the new current balance
      const totalTradeProfit = trades.reduce((sum, trade) => sum + trade.result, 0);
      const totalWithdrawals = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
      const newCurrentBalance = Math.round((numericStartingBalance + totalTradeProfit - totalWithdrawals) * 100) / 100;

      console.log('New current balance calculated:', newCurrentBalance);
      console.log('Based on: Starting Balance:', numericStartingBalance, 'Total Profit:', totalTradeProfit, 'Total Withdrawals:', totalWithdrawals);

      // Update both starting_balance and current_balance in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          starting_balance: numericStartingBalance,
          current_balance: newCurrentBalance
        })
        .eq('id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Update the user state
      set({
        user: {
          ...user,
          startingBalance: numericStartingBalance,
          currentBalance: newCurrentBalance
        }
      });

      return newCurrentBalance;
    } catch (error) {
      console.error('Update starting balance error:', error);
      if (error instanceof Error) {
        set({ error: error.message });
        throw error;
      } else {
        const genericError = new Error('An unknown error occurred');
        set({ error: genericError.message });
        throw genericError;
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));