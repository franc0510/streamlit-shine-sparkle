import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[DEBUG] VITE_SUPABASE_URL set?', !!SUPABASE_URL);
console.log('[DEBUG] VITE_SUPABASE_ANON_KEY set?', !!SUPABASE_ANON_KEY);

export const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
});

// Petit test pour afficher l’URL des Edge Functions
if (SUPABASE_URL) {
  const edgeBase = SUPABASE_URL.replace('.supabase.co', '.functions.supabase.co');
  console.log('[DEBUG] Edge base =', edgeBase);
}
