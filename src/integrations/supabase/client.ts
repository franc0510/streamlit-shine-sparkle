import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// ⚠️ Fallback temporaire pour débloquer si Lovable n'injecte pas les env
const FALLBACK_URL = "https://obivwrnbupnbcqzxvztp.supabase.co";
const FALLBACK_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZG96eXF2cm1oY2hxemF0eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODIyNzUsImV4cCI6MjA3Nzc1ODI3NX0.Vl3bNsbAyxX4ko47qE5y3PJJdTCjyoPKJGT0VmaMZ1I";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON;

console.log("[DEBUG] VITE_SUPABASE_URL set?", !!import.meta.env.VITE_SUPABASE_URL, "=>", SUPABASE_URL);
console.log("[DEBUG] VITE_SUPABASE_ANON_KEY set?", !!import.meta.env.VITE_SUPABASE_ANON_KEY, "len=", (SUPABASE_ANON_KEY?.length || 0));

// Petit test pour afficher l'URL des Edge Functions
if (SUPABASE_URL) {
  const edgeBase = SUPABASE_URL.replace('.supabase.co', '.functions.supabase.co');
  console.log('[DEBUG] Edge base =', edgeBase);
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
