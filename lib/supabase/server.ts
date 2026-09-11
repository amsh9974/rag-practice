import { createClient } from "@supabase/supabase-js";

// Server-only client, used from server actions and route handlers. It runs
// with the anon key, so every write it makes is still subject to the RLS
// policies in supabase/migrations - this client has no elevated access.
export function createServerSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be set - see .env.example.",
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
