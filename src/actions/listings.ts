"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getAccount } from "@/lib/auth";
import { categoryLabel, categorySingular, isCategorySlug } from "@/lib/categories";
import { adminEmails, sendEmail } from "@/lib/email";
import { formatMoney, KIND_LABELS, listingRef } from "@/lib/format";
import {
  LIMITS,
  parseAmount,
  parseYear,
  suggestTitle,
  validateForSubmit,
  type ListingDraft,
} from "@/lib/listing-input";
import { MAX_IMAGES, MAX_VIDEOS, MEDIA_BUCKET, parseVideoUrl } from "@/lib/media";
import { getOrigin } from "@/lib/request";
import { CURRENCIES } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, Condition, ListingStatus, OperationalSummary, RunningStatus } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { fail, str, zodFieldErrors } from "@/lib/validation";

export interface SaveResult extends ActionResult {
  id?: string;
  status?: ListingStatus;
}

const text = (max: number) => z.string().max(max, `Please keep this under ${max} characters.`);

const draftSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["single", "setup"]),
  title: text(LIMITS.title),
  description: text(LIMITS.description),
  city: text(80),
  country: text(80),
  priceType: z.enum(["fixed", "negotiable", "on_request"]),
  priceAmount: text(24),
  priceCurrency: z.enum(CURRENCIES),
  availability: text(LIMITS.text),
  inspectionAvailable: z.boolean(),
  loadingAssistance: z.boolean(),
  confirmAuthentic: z.boolean(),
  items: z
    .array(
      z.object({
        category: text(60),
        manufacturer: text(80),
        model: text(80),
        year: text(6),
        condition: z.enum(["new", "used", "refurbished"]),
        runningStatus: z.enum(["running", "not_running", ""]),
        statusNote: text(LIMITS.note),
        extras: text(LIMITS.extras),
        specs: z.array(z.object({ label: text(LIMITS.specLabel), value: text(LIMITS.specValue) })).max(LIMITS.specs),
      }),
    )
    .min(1)
    .max(LIMITS.items, `A setup can have up to ${LIMITS.items} machines.`),
  media: z
    .array(
      z.object({
        id: z.uuid(),
        kind: z.enum(["image", "video", "video_link"]),
        storagePath: z.string().max(300).nullable(),
        thumbPath: z.string().max(300).nullable(),
        url: z.string().max(500).nullable(),
        caption: text(LIMITS.caption),
      }),
    )
    .max(LIMITS.media),
});

function summarizeRunning(values: (RunningStatus | null)[]): OperationalSummary | null {
  const known = values.filter(Boolean);
  if (known.length === 0) return null;
  if (known.every((v) => v === "running") && known.length === values.length) return "running";
  if (known.every((v) => v === "not_running")) return known.length === values.length ? "not_running" : null;
  return known.includes("running") && known.includes("not_running") ? "partly_running" : known[0] ?? null;
}

export async function saveListing(input: ListingDraft, intent: "draft" | "submit"): Promise<SaveResult> {
  const account = await getAccount();
  if (!account) return fail("Your session has ended. Sign in again in a new tab, then come back and save.");
  if (!account.onboarding.complete) return fail("Finish the steps on your dashboard before listing machines.");
  const userId = account.user.id;

  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return fail("Some details are too long or not valid.", zodFieldErrors(parsed.error));
  const d = parsed.data as ListingDraft;
  if (d.kind === "single") d.items = d.items.slice(0, 1);

  // Media must be in this seller's storage folder, or a valid video link.
  let images = 0;
  let videos = 0;
  for (const m of d.media) {
    if (m.kind === "video_link") {
      if (!m.url || !parseVideoUrl(m.url)) return fail("One of the video links is not a valid web address.");
      m.storagePath = null;
      m.thumbPath = null;
      videos += 1;
    } else {
      const ok = (p: string | null) => !p || (p.startsWith(`${userId}/`) && !p.includes(".."));
      if (!m.storagePath || !ok(m.storagePath) || !ok(m.thumbPath)) {
        return fail("A photo or video could not be checked. Remove it and upload it again.");
      }
      m.url = null;
      if (m.kind === "image") images += 1;
      else videos += 1;
    }
  }
  if (images > MAX_IMAGES) return fail(`Please use at most ${MAX_IMAGES} photos.`);
  if (videos > MAX_VIDEOS) return fail(`Please use at most ${MAX_VIDEOS} videos.`);

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("listings")
    .select("id, seller_id, status, submitted_at, authenticity_confirmed_at")
    .eq("id", d.id)
    .maybeSingle();
  if (existing && existing.seller_id !== userId) return fail("This listing belongs to another account.");
  const current: ListingStatus = existing?.status ?? "draft";
  if (current === "rejected" || current === "sold") return fail("This listing can no longer be edited.");

  let status: ListingStatus = current;
  let submittedAt: string | null = existing?.submitted_at ?? null;
  let event: string | null = existing ? null : "created";
  const now = new Date().toISOString();

  if (intent === "submit") {
    const errors = validateForSubmit(d);
    if (Object.keys(errors).length > 0) {
      return { ok: false, message: "Some required details are missing. They are marked in red.", fieldErrors: errors };
    }
    status = "pending";
    submittedAt = now;
    event =
      current === "published"
        ? "edited_after_publish"
        : current === "changes_requested"
          ? "resubmitted"
          : current === "archived"
            ? "relisted"
            : current === "pending"
              ? null
              : "submitted";
  } else if (current === "published") {
    return fail("Changes to a published listing must be sent for review. Use “Submit changes for review”.");
  }

  const maxYear = new Date().getFullYear() + 1;
  const items = d.items.map((it, i) => {
    const year = parseYear(it.year);
    return {
      position: i,
      category: isCategorySlug(it.category) ? it.category : "",
      manufacturer: it.manufacturer.trim(),
      model: it.model.trim(),
      year: year && year >= 1900 && year <= maxYear ? year : null,
      condition: it.condition,
      running_status: (it.runningStatus || null) as RunningStatus | null,
      status_note: it.statusNote.trim() || null,
      specs: it.specs
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .filter((s) => s.label && s.value),
      extras: it.extras.trim() || null,
    };
  });
  const first = items[0];
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const conditions = [...new Set(items.map((i) => i.condition))] as Condition[];
  const condition: Condition = conditions.length === 1 ? conditions[0] : conditions.includes("used") ? "used" : conditions[0];
  const cover = d.media.find((m) => m.kind === "image");
  const title = d.title.trim() || suggestTitle(d, categorySingular) || "Untitled machine";
  const priceAmount = d.priceType === "on_request" ? null : parseAmount(d.priceAmount);

  const searchText = [
    title,
    ...items.flatMap((it) => [
      it.manufacturer,
      it.model,
      it.model.replace(/[\s\-/.]/g, ""),
      it.category ? categoryLabel(it.category) : "",
      it.category ? categorySingular(it.category) : "",
    ]),
    d.kind === "setup" ? "complete setup production line plant" : "",
    d.city,
    d.country,
    d.description.slice(0, 3000),
  ]
    .filter(Boolean)
    .join(" ");

  const listingRow = {
    id: d.id,
    seller_id: userId,
    status,
    kind: d.kind,
    title,
    slug: slugify(title),
    primary_category: first.category,
    categories,
    description: d.description.trim(),
    manufacturer: first.manufacturer,
    model: first.model,
    year: first.year,
    condition,
    operational_status: summarizeRunning(items.map((i) => i.running_status)),
    item_count: items.length,
    price_type: d.priceType,
    price_amount: priceAmount,
    price_currency: d.priceCurrency,
    city: d.city.trim(),
    country: d.country.trim() || "Pakistan",
    availability: d.availability.trim() || null,
    inspection_available: d.inspectionAvailable,
    loading_assistance: d.loadingAssistance,
    cover_path: cover?.storagePath ?? null,
    cover_thumb_path: cover?.thumbPath ?? cover?.storagePath ?? null,
    search_text: searchText,
    authenticity_confirmed_at: d.confirmAuthentic ? (existing?.authenticity_confirmed_at ?? now) : null,
    submitted_at: submittedAt,
  };
  const mediaRows = d.media.map((m, i) => ({
    id: m.id,
    kind: m.kind,
    storage_path: m.storagePath,
    thumb_path: m.thumbPath,
    url: m.url,
    caption: m.caption.trim() || null,
    position: i,
  }));

  const { data: oldMedia } = existing
    ? await admin.from("listing_media").select("storage_path, thumb_path").eq("listing_id", d.id)
    : { data: [] as { storage_path: string | null; thumb_path: string | null }[] };

  const { error } = await admin.rpc("save_listing", { p_listing: listingRow, p_items: items, p_media: mediaRows });
  if (error) {
    console.error("[saveListing]", error.message);
    return fail("The listing could not be saved. Please try again.");
  }

  // Remove files the seller deleted from the listing.
  const keep = new Set(mediaRows.flatMap((m) => [m.storage_path, m.thumb_path]).filter(Boolean));
  const removed = (oldMedia ?? [])
    .flatMap((m) => [m.storage_path, m.thumb_path])
    .filter((p): p is string => Boolean(p) && !keep.has(p));
  if (removed.length) await admin.storage.from(MEDIA_BUCKET).remove(removed);

  if (event) {
    await admin.from("listing_events").insert({ listing_id: d.id, actor_id: userId, action: event });
  }

  if (intent === "submit" && event && event !== "created") {
    const origin = await getOrigin();
    const { data: saved } = await admin.from("listings").select("ref").eq("id", d.id).single();
    const recipients = adminEmails();
    const companyName = account.company.name;
    after(async () => {
      if (!saved || recipients.length === 0) return;
      await sendEmail(recipients, {
        subject: `Review needed: ${listingRef(saved.ref)} ${title}`,
        heading: event === "edited_after_publish" ? "A published listing was edited" : "A listing is waiting for review",
        intro: `${companyName} submitted “${title}”. It stays hidden from buyers until you approve it.`,
        rows: [
          ["Reference", listingRef(saved.ref)],
          ["Seller", companyName],
          ["Type", d.kind === "setup" ? `${KIND_LABELS.setup} (${items.length} machines)` : categorySingular(first.category)],
          ["Model", `${first.manufacturer} ${first.model}`],
          ["Location", `${listingRow.city}, ${listingRow.country}`],
          ["Price", priceAmount ? formatMoney(priceAmount, d.priceCurrency) : "On request"],
        ],
        cta: { label: "Review the listing", url: `${origin}/admin/listings/${d.id}` },
      });
    });
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/machines");
  return {
    ok: true,
    id: d.id,
    status,
    message:
      intent === "submit"
        ? "Submitted. Ware Print will review your listing and email you when it is live."
        : "Draft saved.",
  };
}

async function ownListing(id: string) {
  const account = await getAccount();
  if (!account) return { error: fail("Your session has ended. Please sign in again.") } as const;
  const admin = createAdminClient();
  const { data: listing } = await admin
    .from("listings")
    .select("id, ref, title, status, seller_id, price_currency")
    .eq("id", id)
    .maybeSingle();
  if (!listing || listing.seller_id !== account.user.id) return { error: fail("Listing not found.") } as const;
  return { account, admin, listing } as const;
}

/** Delete a draft or rejected listing, or take any other listing off the site. */
export async function removeListing(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  const res = await ownListing(id);
  if ("error" in res) return res.error!;
  const { admin, listing, account } = res;

  if (listing.status === "draft" || listing.status === "rejected") {
    const { data: media } = await admin.from("listing_media").select("storage_path, thumb_path").eq("listing_id", id);
    const paths = (media ?? []).flatMap((m) => [m.storage_path, m.thumb_path]).filter((p): p is string => Boolean(p));
    await admin.from("listings").delete().eq("id", id);
    if (paths.length) await admin.storage.from(MEDIA_BUCKET).remove(paths);
    revalidatePath("/dashboard", "layout");
    redirect("/dashboard/listings?deleted=1");
  }
  if (!["published", "pending", "changes_requested"].includes(listing.status)) {
    return fail("This listing cannot be removed.");
  }
  await admin.from("listings").update({ status: "archived" }).eq("id", id);
  await admin.from("listing_events").insert({ listing_id: id, actor_id: account.user.id, action: "archived" });
  revalidatePath("/dashboard", "layout");
  revalidatePath("/machines");
  return { ok: true, message: "The listing was taken off Ware Print. You can edit and resubmit it at any time." };
}

/** Change the price of a live listing without sending it back for review. */
export async function updatePrice(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  const priceType = str(formData.get("priceType"));
  const currency = str(formData.get("currency")) || "PKR";
  if (!["fixed", "negotiable", "on_request"].includes(priceType)) return fail("Choose how the price is shown.");
  if (!(CURRENCIES as readonly string[]).includes(currency)) return fail("Choose a currency.");
  const amount = priceType === "on_request" ? null : parseAmount(str(formData.get("amount")));
  if (priceType !== "on_request" && !amount) {
    return { ok: false, message: "Please check the highlighted field.", fieldErrors: { amount: "Enter the new price." } };
  }

  const res = await ownListing(id);
  if ("error" in res) return res.error!;
  const { admin, listing, account } = res;
  if (listing.status !== "published") return fail("Only live listings can use quick price updates.");

  await admin.from("listings").update({ price_type: priceType, price_amount: amount, price_currency: currency }).eq("id", id);
  await admin.from("listing_events").insert({
    listing_id: id,
    actor_id: account.user.id,
    action: "price_updated",
    note: amount ? `${formatMoney(amount, currency)}${priceType === "negotiable" ? " (negotiable)" : ""}` : "Price on request",
  });
  revalidatePath("/dashboard", "layout");
  revalidatePath("/machines");
  return { ok: true, message: "Price updated. Buyers see the new price now." };
}

const soldSchema = z.object({
  id: z.uuid(),
  via: z.enum(["wareprint", "elsewhere"], { error: "Tell us who bought the machine." }),
  price: z.string().max(24),
  currency: z.enum(CURRENCIES),
  buyerName: z.string().max(120),
  notes: z.string().max(1000),
});

export async function markSold(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = soldSchema.safeParse({
    id: str(formData.get("id")),
    via: str(formData.get("via")),
    price: str(formData.get("price")),
    currency: str(formData.get("currency")) || "PKR",
    buyerName: str(formData.get("buyerName")),
    notes: str(formData.get("notes")),
  });
  if (!parsed.success) return fail("Please check the highlighted fields.", zodFieldErrors(parsed.error));
  const d = parsed.data;
  const viaWarePrint = d.via === "wareprint";
  const price = parseAmount(d.price);
  if (viaWarePrint && !price) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { price: "Enter the final sale price." } };
  }
  if (viaWarePrint && !d.buyerName) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: { buyerName: "Enter the buyer's name or company." } };
  }

  const res = await ownListing(d.id);
  if ("error" in res) return res.error!;
  const { admin, listing, account } = res;
  if (listing.status !== "published") return fail("Only published listings can be marked as sold.");

  const commission = viaWarePrint && price ? Math.round(price * 0.02 * 100) / 100 : null;
  const now = new Date().toISOString();
  const { error } = await admin.from("sales").insert({
    listing_id: d.id,
    seller_id: account.user.id,
    sold_via_wareprint: viaWarePrint,
    sale_price: price,
    currency: d.currency,
    commission_amount: commission,
    commission_status: viaWarePrint ? "due" : "not_applicable",
    buyer_name: d.buyerName || null,
    notes: d.notes || null,
  });
  if (error) {
    console.error("[markSold]", error.message);
    return fail("The sale could not be saved. Please try again.");
  }
  await admin.from("listings").update({ status: "sold", sold_at: now }).eq("id", d.id);
  await admin.from("listing_events").insert({
    listing_id: d.id,
    actor_id: account.user.id,
    action: "marked_sold",
    note: viaWarePrint ? `Sold to a Ware Print buyer for ${formatMoney(price, d.currency)}` : "Sold to a buyer found elsewhere",
  });

  const origin = await getOrigin();
  const recipients = adminEmails();
  after(async () => {
    if (recipients.length === 0) return;
    await sendEmail(recipients, {
      subject: `Sale reported: ${listingRef(listing.ref)} ${listing.title}`,
      heading: viaWarePrint ? "Sale reported — commission due" : "Sale reported (buyer found elsewhere)",
      intro: `${account.company.name} marked “${listing.title}” as sold.`,
      rows: [
        ["Reference", listingRef(listing.ref)],
        ["Seller", account.company.name],
        ["Buyer came through Ware Print", viaWarePrint ? "Yes" : "No — seller says buyer was found elsewhere"],
        ["Buyer", d.buyerName],
        ["Sale price", price ? formatMoney(price, d.currency) : "Not given"],
        ["Commission (2%)", commission ? formatMoney(commission, d.currency) : "—"],
        ["Seller's note", d.notes],
      ],
      cta: { label: "Open sales & commission", url: `${origin}/admin/sales` },
    });
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/machines");
  redirect(`/dashboard/listings/${d.id}?sold=1`);
}
