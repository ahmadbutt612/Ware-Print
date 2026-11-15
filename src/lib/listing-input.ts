// Shape of the listing editor's data, shared by the browser editor and the
// server action. validateForSubmit() is the single source of truth for what a
// listing needs before it can go to Ware Print for review.

import { isCategorySlug } from "@/lib/categories";
import type { Condition, ListingFull, ListingKind, MediaKind, PriceType, RunningStatus } from "@/lib/types";

export interface SpecDraft {
  label: string;
  value: string;
}

export interface ItemDraft {
  category: string;
  manufacturer: string;
  model: string;
  year: string;
  condition: Condition;
  runningStatus: RunningStatus | "";
  statusNote: string;
  specs: SpecDraft[];
  extras: string;
}

export interface MediaDraft {
  id: string;
  kind: MediaKind;
  storagePath: string | null;
  thumbPath: string | null;
  url: string | null;
  caption: string;
}

export interface ListingDraft {
  id: string;
  kind: ListingKind;
  title: string;
  description: string;
  city: string;
  country: string;
  priceType: PriceType;
  priceAmount: string;
  priceCurrency: string;
  availability: string;
  inspectionAvailable: boolean;
  loadingAssistance: boolean;
  items: ItemDraft[];
  media: MediaDraft[];
  confirmAuthentic: boolean;
}

export const LIMITS = {
  title: 140,
  description: 8000,
  items: 15,
  specs: 40,
  specLabel: 80,
  specValue: 300,
  text: 120,
  note: 300,
  extras: 1000,
  caption: 140,
  media: 40,
};

export function emptyItem(category = ""): ItemDraft {
  return {
    category,
    manufacturer: "",
    model: "",
    year: "",
    condition: "used",
    runningStatus: "",
    statusNote: "",
    specs: [],
    extras: "",
  };
}

export function newDraft(id: string, city: string, country: string): ListingDraft {
  return {
    id,
    kind: "single",
    title: "",
    description: "",
    city,
    country: country || "Pakistan",
    priceType: "on_request",
    priceAmount: "",
    priceCurrency: "PKR",
    availability: "",
    inspectionAvailable: true,
    loadingAssistance: false,
    items: [emptyItem()],
    media: [],
    confirmAuthentic: false,
  };
}

export function draftFromListing(l: ListingFull): ListingDraft {
  const items = [...l.listing_items].sort((a, b) => a.position - b.position);
  const media = [...l.listing_media].sort((a, b) => a.position - b.position);
  return {
    id: l.id,
    kind: l.kind,
    title: l.title,
    description: l.description,
    city: l.city,
    country: l.country,
    priceType: l.price_type,
    priceAmount: l.price_amount ? String(Number(l.price_amount)) : "",
    priceCurrency: l.price_currency,
    availability: l.availability ?? "",
    inspectionAvailable: l.inspection_available,
    loadingAssistance: l.loading_assistance,
    items: items.length
      ? items.map((it) => ({
          category: it.category,
          manufacturer: it.manufacturer,
          model: it.model,
          year: it.year ? String(it.year) : "",
          condition: it.condition,
          runningStatus: it.running_status ?? "",
          statusNote: it.status_note ?? "",
          specs: Array.isArray(it.specs) ? it.specs : [],
          extras: it.extras ?? "",
        }))
      : [emptyItem()],
    media: media.map((m) => ({
      id: m.id,
      kind: m.kind,
      storagePath: m.storage_path,
      thumbPath: m.thumb_path,
      url: m.url,
      caption: m.caption ?? "",
    })),
    confirmAuthentic: Boolean(l.authenticity_confirmed_at),
  };
}

export function parseAmount(value: string): number | null {
  const n = Number(String(value).replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseYear(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

/** Everything that must be true before a listing can be submitted for review. */
export function validateForSubmit(d: ListingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const maxYear = new Date().getFullYear() + 1;

  if (!d.title.trim()) errors.title = "Add a title for the listing.";
  if (!d.city.trim()) errors.city = "Enter the city where the machine is located.";
  if (!d.country.trim()) errors.country = "Enter the country.";
  if (d.kind === "setup" && d.items.length < 2) {
    errors.items = "A complete setup needs at least two machines. Add another machine or choose “Single machine”.";
  }

  d.items.forEach((item, i) => {
    if (!isCategorySlug(item.category)) errors[`items.${i}.category`] = "Choose what type of machine this is.";
    if (!item.manufacturer.trim()) errors[`items.${i}.manufacturer`] = "Enter the manufacturer. Write “Local” if locally made.";
    if (!item.model.trim()) errors[`items.${i}.model`] = "The model is required.";
    if (!item.runningStatus) errors[`items.${i}.runningStatus`] = "Say whether this machine is running right now.";
    if (item.year.trim()) {
      const year = parseYear(item.year);
      if (!year || year < 1900 || year > maxYear) errors[`items.${i}.year`] = `Enter a year between 1900 and ${maxYear}.`;
    }
  });

  if (!d.media.some((m) => m.kind === "image")) {
    errors.media = "Add at least one photo of the actual machine. Ware Print uses photos to check every listing.";
  }
  if (d.priceType !== "on_request" && !parseAmount(d.priceAmount)) {
    errors.priceAmount = "Enter the price, or choose “Price on request”.";
  }
  if (!d.confirmAuthentic) {
    errors.confirmAuthentic = "Please confirm the machine is genuine and that you may sell it.";
  }
  return errors;
}

/** Title suggestion from the machines, e.g. "Heidelberg SM 74-4 (2006) — Offset printing press". */
export function suggestTitle(d: Pick<ListingDraft, "kind" | "items">, singular: (slug: string) => string): string {
  const first = d.items[0];
  if (!first) return "";
  const name = [first.manufacturer.trim(), first.model.trim()].filter(Boolean).join(" ");
  if (!name) return "";
  const year = first.year.trim() ? ` (${first.year.trim()})` : "";
  if (d.kind === "setup") {
    const types = d.items
      .map((item) => (item.category ? singular(item.category).toLowerCase() : ""))
      .filter((t, i, all) => t && all.indexOf(t) === i);
    return types.length > 1
      ? `Complete setup: ${types.slice(0, 3).join(" + ")}`
      : `${name}${year} — complete setup of ${d.items.length} machines`;
  }
  return first.category ? `${name}${year} — ${singular(first.category)}` : `${name}${year}`;
}
