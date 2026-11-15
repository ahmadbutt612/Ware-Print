import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { site } from "@/lib/site";

function serverSecret(): string {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "ware-print-dev-secret";
}

export function hmac(value: string): string {
  return createHmac("sha256", serverSecret()).update(value).digest("hex");
}

export async function getRequestMeta() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip") || "unknown";
  const userAgent = (h.get("user-agent") ?? "").slice(0, 400);
  return { ip, userAgent, ipHash: hmac(`ip:${ip}`) };
}

/** The site's own origin for links in emails (works on localhost and in production). */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/+$/, "");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return site.url;
}
