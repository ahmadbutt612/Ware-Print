import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { isSupabaseConfigured, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";
import { listingPath } from "@/lib/format";
import { site } from "@/lib/site";

// Rebuilt at most once an hour.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/machines`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/categories`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${site.url}/sell`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/seller-agreement`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...CATEGORIES.map((c) => ({
      url: `${site.url}/machines?category=${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  if (!isSupabaseConfigured()) return pages;
  try {
    // Plain anonymous client: the sitemap only ever lists public listings.
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("listings")
      .select("ref, slug, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5000);
    for (const l of (data ?? []) as { ref: number; slug: string; updated_at: string }[]) {
      pages.push({ url: `${site.url}${listingPath(l.ref, l.slug)}`, lastModified: new Date(l.updated_at), priority: 0.8 });
    }
  } catch (error) {
    console.error("[sitemap]", error);
  }
  return pages;
}
