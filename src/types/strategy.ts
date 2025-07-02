// Supabase types for strategies table
export interface StrategyInsert {
  id?: string;
  user_id: string;
  name: string;
  type?: string;
  created_at?: string;
}
