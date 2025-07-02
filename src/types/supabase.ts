export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          starting_balance: number
          current_balance: number
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          starting_balance: number
          current_balance: number
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          starting_balance?: number
          current_balance?: number
        }
      }
      trades: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          pair: string
          session: string
          direction: 'long' | 'short'
          sl_pips: number
          tp_pips: number
          risk_reward_ratio: number
          outcome: 'win' | 'loss' | 'BE'
          result: number
          balance_after_trade: number
          image_link: string | null
          remarks: string | null
          account: string // 'Live' or 'Backtest'
          strategy: string // strategy id
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          pair: string
          session: string
          direction: 'long' | 'short'
          sl_pips: number
          tp_pips: number
          risk_reward_ratio: number
          outcome: 'win' | 'loss' | 'BE'
          result: number
          balance_after_trade: number
          image_link?: string | null
          remarks?: string | null
          account: string
          strategy: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          pair?: string
          session?: string
          direction?: 'long' | 'short'
          sl_pips?: number
          tp_pips?: number
          risk_reward_ratio?: number
          outcome?: 'win' | 'loss' | 'BE'
          result?: number
          balance_after_trade?: number
          image_link?: string | null
          remarks?: string | null
          account?: string
          strategy?: string
        }
      }
      withdrawals: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          amount: number
          balance_before: number
          balance_after: number
          remarks: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          amount: number
          balance_before: number
          balance_after: number
          remarks?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          amount?: number
          balance_before?: number
          balance_after?: number
          remarks?: string | null
        }
      }
    }
  }
}