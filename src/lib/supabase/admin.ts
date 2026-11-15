import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";

/**
 * Server-only client with the secret key. It bypasses row level security,
 * so every caller must check who the user is and what they may change first.
 */
export function createAdminClient() {
  const key = (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY is not set. See SETUP-GUIDE.md, step 3.");
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
