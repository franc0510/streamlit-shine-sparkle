// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  (import.meta.env as any).VITE_SUPABASE_ANON_KEY ||
  (import.meta.env as any).VITE_SUPABASE_PUBLISHABLE_KEY; // fallback to publishable key

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] Missing VITE_SUPABASE_URL or Supabase key (VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY)');
}

export const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
