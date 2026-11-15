import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

/**
 * Landing point for links in Supabase emails (confirm sign-up, reset password).
 * Works with both the recommended token_hash links and the default ?code= links.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"), type === "recovery" ? "/reset-password" : "/dashboard");

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (!ok) {
    const failed = new URL("/login", url.origin);
    failed.searchParams.set("error", type === "recovery" || next === "/reset-password" ? "reset-link" : "link");
    return NextResponse.redirect(failed);
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
