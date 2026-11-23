import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Company, Facets, ListingCard, ListingFull } from "@/lib/types";

export const SORTS = {
  newest: "Newest listed",
  relevance: "Best match",
  year_desc: "Year: newest machine",
  year_asc: "Year: oldest machine",
} as const;
export type SortKey = keyof typeof SORTS;

export interface ListingQuery {
  q?: string;
  category?: string;
  kind?: string;
  condition?: string;
  running?: string;
  city?: string;
  country?: string;
  yearMin?: number | null;
  yearMax?: number | null;
  withPrice?: boolean;
  seller?: string;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

/** Strip characters that have meaning in search syntax or LIKE patterns. */
export function cleanQuery(q: string | undefined): string {
  return (q ?? "").replace(/[%_\\*()<>:;!&|'"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

export async function searchListings(query: ListingQuery): Promise<{ rows: ListingCard[]; total: number }> {
  const supabase = await createClient();
  const perPage = query.perPage ?? 20;
  const page = Math.max(1, query.page ?? 1);
  const q = cleanQuery(query.q);
  const { data, error } = await supabase.rpc("search_listings", {
    p_q: q || null,
    p_category: query.category || null,
    p_kind: query.kind || null,
    p_condition: query.condition || null,
    p_running: query.running || null,
    p_city: query.city || null,
    p_country: query.country || null,
    p_year_min: query.yearMin ?? null,
    p_year_max: query.yearMax ?? null,
    p_with_price: Boolean(query.withPrice),
    p_seller: query.seller || null,
    p_sort: query.sort ?? (q ? "relevance" : "newest"),
    p_limit: perPage,
    p_offset: (page - 1) * perPage,
  });
  if (error) {
    console.error("[search_listings]", error.message);
    return { rows: [], total: 0 };
  }
  const rows = (data ?? []) as ListingCard[];
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

const EMPTY_FACETS: Facets = {
  total: 0,
  sellers: 0,
  categories: {},
  kinds: {},
  running: {},
  conditions: {},
  cities: [],
  countries: [],
};

export const getFacets = cache(async (): Promise<Facets> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("listing_facets");
  if (error || !data) {
    if (error) console.error("[listing_facets]", error.message);
    return EMPTY_FACETS;
  }
  return { ...EMPTY_FACETS, ...(data as Facets) };
});

/**
 * A listing by its reference number, if the current visitor may see it:
 * anyone for published/sold listings, the owner for any status.
 */
export const getListingByRef = cache(async function getListingByRef(ref: number): Promise<ListingFull | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_items(*), listing_media(*)")
    .eq("ref", ref)
    .order("position", { referencedTable: "listing_items", ascending: true })
    .order("position", { referencedTable: "listing_media", ascending: true })
    .maybeSingle();
  if (error) console.error("[getListingByRef]", error.message);
  return (data as ListingFull | null) ?? null;
});

export async function getSimilarListings(category: string, excludeId: string, limit = 4): Promise<ListingCard[]> {
  const { rows } = await searchListings({ category, perPage: limit + 1 });
  return rows.filter((r) => r.id !== excludeId).slice(0, limit);
}

export const getPublicCompany = cache(async function getPublicCompany(id: string): Promise<Company | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  return (data as Company | null) ?? null;
});
