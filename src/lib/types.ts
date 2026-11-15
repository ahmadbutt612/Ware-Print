export type Role = "seller" | "admin";
export type ListingStatus =
  | "draft"
  | "pending"
  | "changes_requested"
  | "published"
  | "rejected"
  | "sold"
  | "archived";
export type ListingKind = "single" | "setup";
export type Condition = "new" | "used" | "refurbished";
export type RunningStatus = "running" | "not_running";
export type OperationalSummary = "running" | "not_running" | "partly_running";
export type PriceType = "fixed" | "negotiable" | "on_request";
export type MediaKind = "image" | "video" | "video_link";
export type InquiryStatus = "new" | "replied" | "closed";
export type CommissionStatus = "due" | "invoiced" | "paid" | "waived" | "not_applicable";

export interface SpecRow {
  label: string;
  value: string;
}

export interface Profile {
  id: string;
  role: Role;
  email: string;
  email_confirmed_at: string | null;
  full_name: string;
  contact_email: string | null;
  address: string | null;
  phone: string | null;
  phone_pending: string | null;
  phone_verified_at: string | null;
  agreement_signed_at: string | null;
  agreement_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  city: string;
  country: string;
  website: string | null;
  about: string | null;
  verified_at: string | null;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  ref: number;
  seller_id: string;
  status: ListingStatus;
  kind: ListingKind;
  title: string;
  slug: string;
  primary_category: string;
  categories: string[];
  description: string;
  manufacturer: string;
  model: string;
  year: number | null;
  condition: Condition | null;
  operational_status: OperationalSummary | null;
  item_count: number;
  price_type: PriceType;
  price_amount: number | null;
  price_currency: string;
  city: string;
  country: string;
  availability: string | null;
  inspection_available: boolean;
  loading_assistance: boolean;
  cover_path: string | null;
  cover_thumb_path: string | null;
  search_text: string;
  authenticity_confirmed_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  published_at: string | null;
  sold_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ListingItem {
  id: string;
  listing_id: string;
  position: number;
  category: string;
  manufacturer: string;
  model: string;
  year: number | null;
  condition: Condition;
  running_status: RunningStatus | null;
  status_note: string | null;
  specs: SpecRow[];
  extras: string | null;
  created_at: string;
}

export interface ListingMedia {
  id: string;
  listing_id: string;
  kind: MediaKind;
  storage_path: string | null;
  thumb_path: string | null;
  url: string | null;
  caption: string | null;
  position: number;
  created_at: string;
}

export type ListingFull = Listing & {
  listing_items: ListingItem[];
  listing_media: ListingMedia[];
};

export interface ListingEvent {
  id: number;
  listing_id: string;
  actor_id: string | null;
  action: string;
  note: string | null;
  created_at: string;
}

export interface Inquiry {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_name: string;
  buyer_company: string | null;
  buyer_email: string;
  buyer_phone: string;
  buyer_city: string | null;
  buyer_country: string | null;
  topics: string[];
  message: string;
  status: InquiryStatus;
  email_sent_at: string | null;
  sms_sent_at: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  listing_id: string;
  seller_id: string;
  sold_via_wareprint: boolean;
  sale_price: number | null;
  currency: string;
  commission_rate: number;
  commission_amount: number | null;
  commission_status: CommissionStatus;
  buyer_name: string | null;
  notes: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerAgreement {
  id: string;
  seller_id: string;
  version: string;
  agreement_text: string;
  signed_name: string;
  company_name: string;
  ip_address: string | null;
  user_agent: string | null;
  signed_at: string;
}

/** A row returned by the search_listings database function. */
export interface ListingCard {
  id: string;
  ref: number;
  slug: string;
  title: string;
  kind: ListingKind;
  primary_category: string;
  categories: string[];
  manufacturer: string;
  model: string;
  year: number | null;
  condition: Condition | null;
  operational_status: OperationalSummary | null;
  item_count: number;
  price_type: PriceType;
  price_amount: number | null;
  price_currency: string;
  city: string;
  country: string;
  cover_thumb_path: string | null;
  published_at: string | null;
  seller_id: string;
  seller_name: string;
  seller_verified: boolean;
  total_count: number;
}

export interface Facets {
  total: number;
  sellers: number;
  categories: Record<string, number>;
  kinds: Record<string, number>;
  running: Record<string, number>;
  conditions: Record<string, number>;
  cities: { name: string; n: number }[];
  countries: { name: string; n: number }[];
}

/** Standard result shape for form actions. */
export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}
