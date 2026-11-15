import type {
  CommissionStatus,
  Condition,
  InquiryStatus,
  ListingKind,
  ListingStatus,
  OperationalSummary,
  PriceType,
} from "@/lib/types";

const TZ = "Asia/Karachi";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TZ,
});
const numberFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const decimalFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return dateFmt.format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return dateTimeFmt.format(new Date(value));
}

/** ISO timestamp for "n days ago" (used in database filters). */
export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "";
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return numberFmt.format(Number(value));
}

export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return "";
  const n = Number(amount);
  const formatted = Number.isInteger(n) ? numberFmt.format(n) : decimalFmt.format(n);
  return `${currency} ${formatted}`;
}

/** 4,500,000 → "45 lakh", 12,500,000 → "1.25 crore" (Pakistani number words). */
export function lakhCrore(amount: number | null | undefined): string | null {
  if (amount === null || amount === undefined) return null;
  const n = Number(amount);
  if (n >= 10_000_000) return `${trimDecimals(n / 10_000_000)} crore`;
  if (n >= 100_000) return `${trimDecimals(n / 100_000)} lakh`;
  return null;
}

function trimDecimals(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

/** "Lahore" for Pakistan (the default market), "Dubai, United Arab Emirates" otherwise. */
export function placeName(city: string, country: string): string {
  if (!country || country.toLowerCase() === "pakistan") return city;
  return city ? `${city}, ${country}` : country;
}

export function listingRef(ref: number | string): string {
  return `WP-${ref}`;
}

export function listingPath(ref: number | string, slug?: string | null): string {
  return slug ? `/machines/${ref}-${slug}` : `/machines/${ref}`;
}

export const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  pending: "Pending review",
  changes_requested: "Changes requested",
  published: "Published",
  rejected: "Rejected",
  sold: "Sold",
  archived: "Removed",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  new: "New",
  used: "Used",
  refurbished: "Refurbished",
};

export const RUNNING_LABELS: Record<OperationalSummary, string> = {
  running: "Running",
  not_running: "Not running",
  partly_running: "Partly running",
};

export const KIND_LABELS: Record<ListingKind, string> = {
  single: "Single machine",
  setup: "Complete setup",
};

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  fixed: "Fixed price",
  negotiable: "Negotiable",
  on_request: "Price on request",
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  replied: "Replied",
  closed: "Closed",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  due: "Due",
  invoiced: "Invoiced",
  paid: "Paid",
  waived: "Waived",
  not_applicable: "Not applicable",
};

export const EVENT_LABELS: Record<string, string> = {
  created: "Draft created",
  submitted: "Submitted for review",
  resubmitted: "Resubmitted after changes",
  edited_after_publish: "Edited — sent back for review",
  approved: "Approved and published",
  changes_requested: "Changes requested by Ware Print",
  rejected: "Rejected by Ware Print",
  unpublished: "Taken down by Ware Print",
  marked_sold: "Marked as sold",
  price_updated: "Price updated by seller",
  archived: "Removed by seller",
  relisted: "Relisted by seller",
};

export const INQUIRY_TOPICS: { id: string; label: string; line: string }[] = [
  { id: "price", label: "Best price", line: "What is your best price?" },
  { id: "condition", label: "Current condition", line: "Please share the current condition and service history." },
  { id: "video", label: "Video running", line: "Can you send a video of the machine running?" },
  { id: "inspection", label: "Inspection visit", line: "I would like to inspect the machine. When can I visit?" },
  { id: "delivery", label: "Loading & delivery", line: "Can you help with dismantling, loading and delivery?" },
];
