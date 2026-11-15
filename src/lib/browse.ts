// Reading and writing the browse page's URL (/machines?category=…&running=…).
import { isCategorySlug } from "@/lib/categories";
import { firstParam, toInt } from "@/lib/utils";

export const PER_PAGE = 20;

export interface BrowseFilters {
  q: string;
  category: string;
  kind: string;
  condition: string;
  running: string;
  city: string;
  country: string;
  year_min: string;
  year_max: string;
  price: string;
  sort: string;
  page: string;
}

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

const KINDS = ["single", "setup"];
const CONDITIONS = ["new", "used", "refurbished"];
const RUNNING = ["running", "not_running", "partly_running"];
const SORTS = ["newest", "relevance", "year_desc", "year_asc"];

export function readFilters(sp: SearchParamsRecord): BrowseFilters {
  const pick = (key: string, allowed?: string[]) => {
    const v = firstParam(sp[key]).trim();
    if (allowed && !allowed.includes(v)) return "";
    return v.slice(0, 100);
  };
  const category = pick("category");
  const year = (key: string) => {
    const n = toInt(firstParam(sp[key]));
    return n && n >= 1900 && n <= 2100 ? String(n) : "";
  };
  const page = toInt(firstParam(sp.page));
  return {
    q: pick("q"),
    category: isCategorySlug(category) ? category : "",
    kind: pick("kind", KINDS),
    condition: pick("condition", CONDITIONS),
    running: pick("running", RUNNING),
    city: pick("city"),
    country: pick("country"),
    year_min: year("year_min"),
    year_max: year("year_max"),
    price: firstParam(sp.price) === "1" ? "1" : "",
    sort: pick("sort", SORTS),
    page: page && page > 1 ? String(Math.min(page, 500)) : "",
  };
}

/** Build a /machines URL from filters, dropping empty values. */
export function browseHref(filters: Partial<BrowseFilters>, changes: Partial<BrowseFilters> = {}): string {
  const merged = { ...filters, ...changes };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/machines?${qs}` : "/machines";
}

/** Number of filters in use (for the mobile "Filters (3)" button). */
export function activeFilterCount(f: BrowseFilters): number {
  return [f.q, f.category, f.kind, f.condition, f.running, f.city, f.country, f.year_min || f.year_max, f.price].filter(
    Boolean,
  ).length;
}
