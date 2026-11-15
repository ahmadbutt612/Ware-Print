// Public settings (safe in the browser). Each name is written out in full so
// Next.js can inline it at build time.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const SUPABASE_PUBLISHABLE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""
).trim();

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.startsWith("http") && SUPABASE_PUBLISHABLE_KEY.length > 20;
}

/** Names of required settings that are still empty (shown on the setup screen). */
export function missingSettings(): string[] {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_PUBLISHABLE_KEY) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (typeof window === "undefined") {
    if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      missing.push("SUPABASE_SECRET_KEY");
    }
  }
  return missing;
}

export const isProduction = process.env.NODE_ENV === "production";
