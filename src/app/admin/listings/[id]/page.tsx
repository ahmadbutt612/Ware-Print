import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reviewListing } from "@/actions/admin";
import { DashHeader } from "@/components/dashboard/dash-header";
import { EventTimeline } from "@/components/listings/event-timeline";
import { ListingView } from "@/components/listings/listing-view";
import { ActionForm, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { IconCheck, IconX } from "@/components/ui/icons";
import { ListingStatusBadge } from "@/components/ui/status";
import { AGREEMENT_VERSION } from "@/lib/agreement";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime, listingPath, listingRef } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Company, ListingEvent, ListingFull, Profile } from "@/lib/types";
import { cn, findContactDetails } from "@/lib/utils";

export const metadata: Metadata = { title: "Review listing" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Check({ ok, warn, children }: { ok: boolean; warn?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span
        className={cn(
          "mt-0.5 grid size-4 shrink-0 place-items-center",
          ok ? "bg-ok text-white" : warn ? "bg-warn text-white" : "bg-red text-white",
        )}
      >
        {ok ? <IconCheck size={10} strokeWidth={3} /> : <IconX size={10} strokeWidth={3} />}
      </span>
      <span className={ok ? "text-ink-2" : "text-ink"}>{children}</span>
    </li>
  );
}

export default async function ReviewListingPage({ params }: PageProps<"/admin/listings/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("listings")
    .select("*, listing_items(*), listing_media(*)")
    .eq("id", id)
    .order("position", { referencedTable: "listing_items", ascending: true })
    .order("position", { referencedTable: "listing_media", ascending: true })
    .maybeSingle();
  if (!data) notFound();
  const listing = data as ListingFull;

  const [{ data: company }, { data: profile }, { data: events }, { count: otherListings }, { count: inquiries }] =
    await Promise.all([
      admin.from("companies").select("*").eq("id", listing.seller_id).single(),
      admin.from("profiles").select("*").eq("id", listing.seller_id).single(),
      admin.from("listing_events").select("id, action, note, created_at").eq("listing_id", id).order("created_at", { ascending: false }),
      admin.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", listing.seller_id).neq("id", id),
      admin.from("inquiries").select("id", { count: "exact", head: true }).eq("listing_id", id),
    ]);
  const seller = profile as Profile | null;
  const comp = company as Company | null;

  const photos = listing.listing_media.filter((m) => m.kind === "image").length;
  const videos = listing.listing_media.length - photos;
  const contacts = findContactDetails(
    [listing.title, listing.description, ...listing.listing_items.map((i) => `${i.extras ?? ""} ${i.status_note ?? ""}`)].join("\n"),
  );
  const allRunningStated = listing.listing_items.every((i) => i.running_status);
  const s = listing.status;
  const canApprove = s === "pending" || s === "changes_requested";
  const canChange = s === "pending" || s === "published";
  const canReject = s === "pending" || s === "changes_requested" || s === "published";

  return (
    <div className="space-y-8">
      <DashHeader
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="font-mono">{listingRef(listing.ref)}</span>
            <ListingStatusBadge status={s} />
          </span>
        }
        title={listing.title || "Untitled"}
        description={listing.submitted_at ? `Submitted ${formatDateTime(listing.submitted_at)}` : undefined}
        actions={
          <Link href="/admin/listings" className="btn btn-outline btn-sm">
            Back to queue
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-line p-5">
          <h2 className="font-semibold">Automatic checks</h2>
          <ul className="mt-3 space-y-2">
            <Check ok={photos >= 3} warn={photos > 0}>
              {photos} photo{photos === 1 ? "" : "s"}
              {videos ? `, ${videos} video${videos === 1 ? "" : "s"}` : ""}
              {photos < 3 && " — fewer than 3 photos makes it hard to judge the machine"}
            </Check>
            <Check ok={contacts.length === 0} warn>
              {contacts.length === 0
                ? "No phone numbers or emails in the text"
                : `Contact details in the text: ${contacts.slice(0, 3).join(", ")} — ask the seller to remove them`}
            </Check>
            <Check ok={allRunningStated}>Running status stated for every machine</Check>
            <Check ok={Boolean(listing.authenticity_confirmed_at)}>
              Seller confirmed the machine is genuine
              {listing.authenticity_confirmed_at ? ` (${formatDate(listing.authenticity_confirmed_at)})` : ""}
            </Check>
            <Check ok={Boolean(seller?.phone_verified_at)}>
              Phone verified{seller?.phone ? `: ${formatPhone(seller.phone)}` : ""}
            </Check>
            <Check ok={seller?.agreement_version === AGREEMENT_VERSION}>
              Seller oath signed{seller?.agreement_signed_at ? ` on ${formatDate(seller.agreement_signed_at)}` : ""}
            </Check>
            <Check ok={!comp?.is_suspended}>{comp?.is_suspended ? "Seller is suspended" : "Seller account active"}</Check>
          </ul>
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-sm font-semibold">Check by eye</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2">
              <li>The photos show a real machine, not brochure or internet images.</li>
              <li>It is a printing, packaging or converting machine, or a part for one.</li>
              <li>The manufacturer and model match each other and the photos (nameplate if shown).</li>
              <li>The title and price look sensible for the machine and its year.</li>
            </ul>
          </div>
        </section>

        <div className="space-y-6">
          {(canApprove || canChange || canReject) && (
            <section className="border border-ink p-5">
              <h2 className="font-semibold">Decision</h2>
              <ActionForm action={reviewListing} className="mt-3 space-y-4">
                <input type="hidden" name="id" value={listing.id} />
                <FormMessage />
                <FormField
                  name="note"
                  label="Note to the seller"
                  hint="Required when requesting changes or rejecting. Optional when approving. The seller receives it by email."
                >
                  <textarea id="note" name="note" rows={4} maxLength={2000} className="field-input" />
                </FormField>
                <div className="flex flex-wrap gap-2">
                  {canApprove && (
                    <PendingButton name="decision" value="approve" className="btn btn-primary" pendingText="Saving…">
                      Approve &amp; publish
                    </PendingButton>
                  )}
                  {canChange && (
                    <PendingButton name="decision" value="changes" className="btn btn-outline" pendingText="Saving…">
                      {s === "published" ? "Take down for changes" : "Request changes"}
                    </PendingButton>
                  )}
                  {canReject && (
                    <PendingButton
                      name="decision"
                      value="reject"
                      className="btn btn-danger"
                      pendingText="Saving…"
                      confirm="Reject this listing? The seller cannot resubmit a rejected listing."
                    >
                      Reject
                    </PendingButton>
                  )}
                </div>
              </ActionForm>
            </section>
          )}

          <section className="border border-line p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">Seller</h2>
              <Link href={`/admin/sellers/${listing.seller_id}`} className="link text-sm">
                Seller details
              </Link>
            </div>
            <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-ink-3">Company</dt>
              <dd className="font-medium">{comp?.name || "—"}</dd>
              <dt className="text-ink-3">Contact</dt>
              <dd>{seller?.full_name || "—"}</dd>
              <dt className="text-ink-3">Email</dt>
              <dd className="break-all">
                {seller?.email}
                {seller?.email_confirmed_at ? " ✓" : " (not confirmed)"}
              </dd>
              <dt className="text-ink-3">Phone</dt>
              <dd>{seller?.phone ? `${formatPhone(seller.phone)} ✓` : seller?.phone_pending ? `${seller.phone_pending} (not verified)` : "—"}</dd>
              <dt className="text-ink-3">Location</dt>
              <dd>{[comp?.city, comp?.country].filter(Boolean).join(", ") || "—"}</dd>
              <dt className="text-ink-3">Joined</dt>
              <dd>{formatDate(seller?.created_at)}</dd>
              <dt className="text-ink-3">Other listings</dt>
              <dd>{otherListings ?? 0}</dd>
              <dt className="text-ink-3">Inquiries</dt>
              <dd>{inquiries ?? 0} on this listing</dd>
            </dl>
          </section>

          <section className="border border-line p-5">
            <h2 className="font-semibold">History</h2>
            <div className="mt-4">
              <EventTimeline events={(events ?? []) as Pick<ListingEvent, "id" | "action" | "note" | "created_at">[]} />
            </div>
          </section>
        </div>
      </div>

      <section aria-label="Listing preview" className="border-t-4 border-ink">
        <p className="bg-ink px-4 py-2 text-sm text-white">
          Preview — exactly what buyers will see.{" "}
          {(s === "published" || s === "sold") && (
            <Link href={listingPath(listing.ref, listing.slug)} className="underline" target="_blank">
              Open the public page
            </Link>
          )}
        </p>
        <div className="-mx-4 lg:-mx-6">
          <ListingView listing={listing} company={comp} inquiry={false} />
        </div>
      </section>
    </div>
  );
}
