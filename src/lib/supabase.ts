import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = () => {
  return (
    !!env.VITE_SUPABASE_URL &&
    env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    !!env.VITE_SUPABASE_ANON_KEY &&
    env.VITE_SUPABASE_ANON_KEY !== 'placeholder-anon-key'
  );
};

// Singleton Supabase Client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

