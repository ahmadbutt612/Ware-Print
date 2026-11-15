import Link from "next/link";
import type { ReactNode } from "react";
import { Gallery } from "@/components/listings/gallery";
import { InquiryForm } from "@/components/listings/inquiry-form";
import { MachineDetails } from "@/components/listings/machine-details";
import { PriceBlock } from "@/components/listings/price";
import { SpecTable } from "@/components/listings/spec-table";
import { IconPin } from "@/components/ui/icons";
import { ConditionChip, KindChip, RunningChip, VerifiedMark } from "@/components/ui/status";
import { categorySingular } from "@/lib/categories";
import { CONDITION_LABELS, formatDate, formatNumber, KIND_LABELS, listingRef, RUNNING_LABELS } from "@/lib/format";
import { buildGallery } from "@/lib/media";
import type { Company, ListingFull } from "@/lib/types";

export function ListingView({
  listing,
  company,
  inquiry = true,
  banner,
}: {
  listing: ListingFull;
  company: Company | null;
  /** Show the inquiry form (only for published listings on the public page) */
  inquiry?: boolean;
  banner?: ReactNode;
}) {
  const ref = listingRef(listing.ref);
  const gallery = buildGallery(listing.listing_media);
  const first = [...listing.listing_items].sort((a, b) => a.position - b.position)[0];
  const sold = listing.status === "sold";
  const canInquire = inquiry && listing.status === "published";
  const typeLabel =
    listing.kind === "setup" ? `${KIND_LABELS.setup} (${listing.item_count} machines)` : categorySingular(listing.primary_category);

  const summary: [string, ReactNode][] = [
    ["Reference", <span key="ref" className="font-mono">{ref}</span>],
    ["Type", typeLabel],
    ["Manufacturer", listing.kind === "single" ? listing.manufacturer : null],
    ["Model", listing.kind === "single" ? listing.model : null],
    ["Year", listing.kind === "single" && listing.year ? String(listing.year) : null],
    ["Condition", listing.condition ? CONDITION_LABELS[listing.condition] : null],
    [
      "Running status",
      listing.operational_status
        ? `${RUNNING_LABELS[listing.operational_status]}${
            listing.kind === "single" && first?.status_note ? `\n${first.status_note}` : ""
          }`
        : null,
    ],
    ["Location", `${listing.city}, ${listing.country}`],
  ];

  return (
    <div className="wrap pt-5 pb-24 lg:pb-10">
      <nav aria-label="Breadcrumb" className="text-[13px] text-ink-3">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/machines" className="hover:text-ink hover:underline">
              Machines
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            {listing.kind === "setup" ? (
              <Link href="/machines?kind=setup" className="hover:text-ink hover:underline">
                Complete setups
              </Link>
            ) : (
              <Link href={`/machines?category=${listing.primary_category}`} className="hover:text-ink hover:underline">
                {categorySingular(listing.primary_category)}
              </Link>
            )}
          </li>
          <li aria-hidden>/</li>
          <li className="font-mono text-ink-2">{ref}</li>
        </ol>
      </nav>

      {banner && <div className="mt-4">{banner}</div>}

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <h1 className="font-cond text-[26px] leading-[1.15] font-bold sm:text-[32px]">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
            <span className="font-mono text-ink">{ref}</span>
            <span className="inline-flex items-center gap-1">
              <IconPin size={14} /> {listing.city}, {listing.country}
            </span>
            {listing.published_at && <span>Listed {formatDate(listing.published_at)}</span>}
            {listing.view_count > 0 && <span>{formatNumber(listing.view_count)} views</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <RunningChip status={listing.operational_status} />
            <ConditionChip condition={listing.condition} />
            <KindChip kind={listing.kind} count={listing.item_count} />
          </div>

          <div className="mt-5">
            <Gallery items={gallery} title={listing.title} />
          </div>

          {/* On phones the side panel comes last, so repeat the essentials here. */}
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border border-line p-4 lg:hidden">
            {sold ? (
              <p className="font-cond text-2xl font-bold">Sold</p>
            ) : (
              <PriceBlock type={listing.price_type} amount={listing.price_amount} currency={listing.price_currency} />
            )}
            {company && (
              <div className="text-sm">
                <p className="text-xs text-ink-3">Seller</p>
                <Link href={`/sellers/${company.id}`} className="font-semibold hover:underline">
                  {company.name}
                </Link>
                {company.verified_at && (
                  <div className="mt-0.5">
                    <VerifiedMark label="Verified" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-10 space-y-10">
            <MachineDetails listing={listing} />

            {listing.description && (
              <section aria-labelledby="desc-heading">
                <h2 id="desc-heading" className="font-cond text-xl font-bold">
                  Description from the seller
                </h2>
                <div className="mt-3 max-w-[72ch] text-[15px] leading-relaxed break-words whitespace-pre-line text-ink-2">
                  {listing.description}
                </div>
              </section>
            )}

            <section aria-labelledby="where-heading">
              <h2 id="where-heading" className="font-cond text-xl font-bold">
                Location &amp; availability
              </h2>
              <SpecTable
                className="mt-3"
                rows={[
                  ["Machine location", `${listing.city}, ${listing.country}`],
                  ["Availability", listing.availability || "Ask the seller"],
                  ["Inspection", listing.inspection_available ? "Buyers can inspect the machine at its location" : "Ask the seller"],
                  [
                    "Dismantling & loading",
                    listing.loading_assistance ? "Seller can help with dismantling and loading" : "Ask the seller",
                  ],
                ]}
              />
            </section>

            {canInquire && (
              <section id="inquiry" aria-labelledby="inquiry-heading" className="scroll-mt-4 border border-ink p-5 sm:p-6">
                <p className="eyebrow">Inspect &amp; quote</p>
                <h2 id="inquiry-heading" className="mt-1 font-cond text-2xl font-bold">
                  Ask the seller about this machine
                </h2>
                <p className="mt-1 mb-5 text-sm text-ink-2">
                  Your question goes to {company?.name ?? "the seller"} by email and SMS. They reply to you directly.
                </p>
                <InquiryForm listingId={listing.id} refLabel={ref} sellerName={company?.name ?? "the seller"} />
              </section>
            )}

            {sold && (
              <section className="border border-ink bg-paper-2 p-5 sm:p-6">
                <h2 className="font-cond text-xl font-bold">This machine has been sold</h2>
                <p className="mt-1 text-sm text-ink-2">
                  It is no longer available. Similar machines may be listed — or{" "}
                  <Link href={`/machines?category=${listing.primary_category}`} className="link">
                    browse {categorySingular(listing.primary_category).toLowerCase()}s
                  </Link>
                  .
                </p>
              </section>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="border border-line bg-paper">
            <div className="p-5">
              {sold ? (
                <p className="font-cond text-2xl font-bold">Sold</p>
              ) : (
                <PriceBlock type={listing.price_type} amount={listing.price_amount} currency={listing.price_currency} />
              )}
              {canInquire && (
                <>
                  <a href="#inquiry" className="btn btn-primary btn-lg mt-4 w-full">
                    Send inquiry
                  </a>
                  <p className="mt-2 text-xs text-ink-3">Free for buyers. Ask for the best price, a video or a visit.</p>
                </>
              )}
            </div>
            <SpecTable rows={summary} className="border-x-0 border-b-0" />
          </div>

          {company && (
            <div className="border border-line bg-paper p-5">
              <p className="eyebrow">Seller</p>
              <p className="mt-1 text-lg leading-snug font-semibold">
                <Link href={`/sellers/${company.id}`} className="hover:underline">
                  {company.name}
                </Link>
              </p>
              <p className="mt-0.5 text-sm text-ink-2">
                {company.city}, {company.country}
              </p>
              {company.verified_at && <VerifiedMark className="mt-2" label="Email and phone verified" />}
              <p className="mt-2 text-xs text-ink-3">On Ware Print since {formatDate(company.created_at)}</p>
              <Link href={`/sellers/${company.id}`} className="link mt-3 inline-block text-sm">
                All machines from this seller
              </Link>
            </div>
          )}

          <div className="border border-line bg-paper-2 p-5 text-sm">
            <p className="font-semibold">Buying safely</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-ink-2">
              <li>Inspect the machine in person, and see it running if it is listed as running.</li>
              <li>Check ownership and import documents before paying.</li>
              <li>Agree payment terms in writing. Avoid paying the full amount in advance.</li>
            </ul>
          </div>
        </aside>
      </div>

      {canInquire && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line bg-paper px-4 py-3 lg:hidden">
          <div className="min-w-0">
            <p className="truncate font-mono text-xs text-ink-3">{ref}</p>
            <p className="truncate text-sm font-semibold">
              {listing.price_type === "on_request" || !listing.price_amount
                ? "Price on request"
                : `${listing.price_currency} ${formatNumber(listing.price_amount)}`}
            </p>
          </div>
          <a href="#inquiry" className="btn btn-primary shrink-0">
            Send inquiry
          </a>
        </div>
      )}
    </div>
  );
}
