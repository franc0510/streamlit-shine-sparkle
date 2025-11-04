import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// ⚠️ Remplace <PROJECT-REF> et <ANON_KEY> par tes vraies valeurs pour tester,
// puis enlève les fallback quand les secrets Lovable sont bien injectés.
const FALLBACK_URL = "https://<PROJECT-REF>.supabase.co";
const FALLBACK_ANON = "<ANON_KEY>";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON;

console.log("[DEBUG] VITE_SUPABASE_URL set?", !!import.meta.env.VITE_SUPABASE_URL);
console.log("[DEBUG] VITE_SUPABASE_ANON_KEY set?", !!import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (and no fallback)");
  // On évite de créer le client si vide -> l’erreur “supabaseKey is required” disparaît
  throw new Error("Supabase env not set");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
