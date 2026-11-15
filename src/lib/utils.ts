export function cn(...classes: (string | number | bigint | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string, maxLength = 80): string {
  const slug = input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // strip accents left by NFKD
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, maxLength).replace(/-+$/g, "") || "machine";
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1).trimEnd()}…`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only allow redirects to paths on this site (blocks //evil.com and https://…). */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function toInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/** Detects phone numbers, emails or WhatsApp mentions in free text (for the review checklist). */
export function findContactDetails(text: string): string[] {
  const found = new Set<string>();
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  email?.forEach((e) => found.add(e));
  const phones = text.match(/(?:\+?\d[\d\s\-]{8,}\d)/g);
  phones?.forEach((p) => {
    if (p.replace(/\D/g, "").length >= 10) found.add(p.trim());
  });
  if (/whats\s?app/i.test(text)) found.add("mentions WhatsApp");
  return [...found];
}
