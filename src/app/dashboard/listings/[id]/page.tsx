import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { removeListing, updatePrice } from "@/actions/listings";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ListingEditor } from "@/components/editor/listing-editor";
import { EventTimeline } from "@/components/listings/event-timeline";
import { ActionForm, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { Notice } from "@/components/ui/notice";
import { ListingStatusBadge } from "@/components/ui/status";
import { requireAccount } from "@/lib/auth";
import { formatDate, formatNumber, listingPath, listingRef } from "@/lib/format";
import { draftFromListing } from "@/lib/listing-input";
import { CURRENCIES } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { ListingEvent, ListingFull } from "@/lib/types";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage listing" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ManageListingPage({ params, searchParams }: PageProps<"/dashboard/listings/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const account = await requireAccount(`/dashboard/listings/${id}`);
  const sp = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*, listing_items(*), listing_media(*)")
    .eq("id", id)
    .eq("seller_id", account.user.id)
    .maybeSingle();
  if (!data) notFound();
  const listing = data as ListingFull;

  const [{ data: eventData }, { count: inquiryCount }] = await Promise.all([
    supabase.from("listing_events").select("id, action, note, created_at").eq("listing_id", id).order("created_at", { ascending: false }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("listing_id", id),
  ]);
  const events = (eventData ?? []) as Pick<ListingEvent, "id" | "action" | "note" | "created_at">[];

  const s = listing.status;
  const editable = ["draft", "pending", "changes_requested", "published", "archived"].includes(s) && account.onboarding.complete;
  const saved = firstParam(sp.saved);
  const preview = listingPath(listing.ref, listing.slug);

  return (
    <div className="space-y-8">
      <DashHeader
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono">{listingRef(listing.ref)}</span>
            <ListingStatusBadge status={s} />
          </span>
        }
        title={listing.title || "Untitled draft"}
        actions={
          <>
            <Link href={preview} className="btn btn-outline btn-sm" target="_blank">
              {s === "published" ? "View live listing" : "Preview"}
            </Link>
            {s === "published" && (
              <Link href={`/dashboard/listings/${id}/sold`} className="btn btn-dark btn-sm">
                Mark as sold
              </Link>
            )}
          </>
        }
      />

      {saved === "submit" && s === "pending" && (
        <Notice tone="ok" title="Submitted for review">
          Ware Print will check your listing and email you when it is live — usually within one working day.
        </Notice>
      )}
      {saved === "draft" && <Notice tone="ok">Draft saved. Submit it for review when you are ready.</Notice>}
      {firstParam(sp.sold) && (
        <Notice tone="ok" title="Marked as sold">
          Thank you for reporting the sale. If the buyer came through Ware Print, we will send you an invoice for the 2%
          commission.
        </Notice>
      )}
      {s === "changes_requested" && (
        <Notice tone="error" title="Ware Print asked for changes">
          <p className="whitespace-pre-line">{listing.review_note || "Please review your listing."}</p>
          <p className="mt-1">Make the changes below, then press “Submit for review”.</p>
        </Notice>
      )}
      {s === "rejected" && (
        <Notice tone="error" title="This listing was not approved">
          <p className="whitespace-pre-line">{listing.review_note || "It does not meet Ware Print's listing rules."}</p>
        </Notice>
      )}
      {s === "archived" && (
        <Notice title="Removed from Ware Print">This listing is hidden. Edit it if needed and submit it to list it again.</Notice>
      )}
      {s === "sold" && <Notice title={`Sold on ${formatDate(listing.sold_at)}`}>This listing stays visible as sold.</Notice>}

      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-paper p-4">
          <p className="text-[13px] text-ink-2">Views</p>
          <p className="tnum font-cond text-2xl font-bold">{formatNumber(listing.view_count)}</p>
        </div>
        <div className="bg-paper p-4">
          <p className="text-[13px] text-ink-2">Inquiries</p>
          <p className="tnum font-cond text-2xl font-bold">
            {inquiryCount ?? 0}
            {(inquiryCount ?? 0) > 0 && (
              <Link href="/dashboard/inquiries" className="link ml-2 font-sans text-sm font-normal">
                Open
              </Link>
            )}
          </p>
        </div>
        <div className="bg-paper p-4">
          <p className="text-[13px] text-ink-2">{listing.published_at ? "First published" : "Created"}</p>
          <p className="font-cond text-2xl font-bold">{formatDate(listing.published_at ?? listing.created_at)}</p>
        </div>
      </div>

      {editable && <ListingEditor initial={draftFromListing(listing)} isNew={false} status={s} userId={account.user.id} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-line p-5">
          <h2 className="font-semibold">History</h2>
          <div className="mt-4">
            <EventTimeline events={events} />
          </div>
        </section>

        <div className="space-y-6">
          {s === "published" && (
            <section className="border border-line p-5">
              <h2 className="font-semibold">Update price</h2>
              <p className="mt-1 text-sm text-ink-2">Changes the price straight away, without another review.</p>
              <ActionForm action={updatePrice} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={id} />
                <FormMessage />
                <select name="priceType" defaultValue={listing.price_type} aria-label="How the price is shown" className="field-input">
                  <option value="negotiable">Negotiable price</option>
                  <option value="fixed">Fixed price</option>
                  <option value="on_request">Price on request</option>
                </select>
                <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
                  <FormField name="amount" label="Price">
                    <input
                      id="amount"
                      name="amount"
                      inputMode="decimal"
                      defaultValue={listing.price_amount ? String(Number(listing.price_amount)) : ""}
                      className="field-input tnum"
                    />
                  </FormField>
                  <FormField name="currency" label="Currency">
                    <select id="currency" name="currency" defaultValue={listing.price_currency} className="field-input">
                      {CURRENCIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <PendingButton className="btn btn-dark btn-sm" pendingText="Saving…">
                  Update price
                </PendingButton>
              </ActionForm>
            </section>
          )}

          {["draft", "rejected", "published", "pending", "changes_requested"].includes(s) && (
            <section className="border border-line p-5">
              <h2 className="font-semibold">{s === "draft" || s === "rejected" ? "Delete listing" : "Take off Ware Print"}</h2>
              <p className="mt-1 text-sm text-ink-2">
                {s === "draft" || s === "rejected"
                  ? "Deletes the listing and its photos permanently."
                  : "Hides the listing from buyers. You can relist it later. If it sold, use “Mark as sold” instead."}
              </p>
              <ActionForm action={removeListing} className="mt-4">
                <input type="hidden" name="id" value={id} />
                <FormMessage className="mb-3" />
                <PendingButton
                  className="btn btn-danger btn-sm"
                  pendingText="Working…"
                  confirm={
                    s === "draft" || s === "rejected"
                      ? "Delete this listing and its photos permanently?"
                      : "Take this listing off Ware Print?"
                  }
                >
                  {s === "draft" || s === "rejected" ? "Delete listing" : "Remove from site"}
                </PendingButton>
              </ActionForm>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
