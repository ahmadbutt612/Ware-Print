import Link from "next/link";
import { NoPhoto } from "@/components/listings/no-photo";
import { PriceLine } from "@/components/listings/price";
import { ConditionChip, KindChip, RunningChip, VerifiedMark } from "@/components/ui/status";
import { categorySingular } from "@/lib/categories";
import { listingPath, listingRef, placeName, timeAgo } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { ListingCard } from "@/lib/types";

/** Dense result row for the browse page. */
export function ListingRow({ listing }: { listing: ListingCard }) {
  const href = listingPath(listing.ref, listing.slug);
  const img = mediaUrl(listing.cover_thumb_path);
  const facts: [string, string][] = [
    ["Make", listing.manufacturer],
    ["Model", listing.model],
    ["Year", listing.year ? String(listing.year) : "—"],
    ["Location", placeName(listing.city, listing.country)],
  ];

  return (
    <article className="group grid grid-cols-[104px_1fr] border border-line bg-paper transition-colors hover:border-ink sm:grid-cols-[208px_1fr]">
      <Link href={href} tabIndex={-1} aria-hidden className="relative block min-h-[104px] border-r border-line bg-paper-2 sm:min-h-[156px]">
        {img ? (
          <img src={img} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        ) : (
          <NoPhoto className="absolute inset-0" />
        )}
      </Link>

      <div className="flex min-w-0 flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:gap-6">
        <div className="min-w-0 flex-1">
          <p className="eyebrow truncate">
            {listing.kind === "setup"
              ? `Complete setup · ${listing.item_count} machines`
              : categorySingular(listing.primary_category)}
          </p>
          <h3 className="mt-0.5 text-[15px] leading-snug font-semibold sm:text-base">
            <Link href={href} className="line-clamp-2 hover:underline">
              {listing.title}
            </Link>
          </h3>
          <dl className="mt-2 hidden grid-cols-2 gap-x-6 gap-y-1 text-[13px] sm:grid xl:grid-cols-4">
            {facts.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-ink-3">{k}</dt>
                <dd className="line-clamp-2 font-medium break-words text-ink">{v || "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-1 truncate text-[13px] text-ink-3 sm:hidden">
            {[listing.year, placeName(listing.city, listing.country)].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <RunningChip status={listing.operational_status} />
            <ConditionChip condition={listing.condition} />
            <KindChip kind={listing.kind} />
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 border-line lg:w-52 lg:shrink-0 lg:flex-col lg:items-end lg:border-l lg:pl-5 lg:text-right">
          <PriceLine type={listing.price_type} amount={listing.price_amount} currency={listing.price_currency} />
          <div className="text-right text-xs text-ink-3">
            <p className="font-mono">{listingRef(listing.ref)}</p>
            <p className="mt-0.5 hidden truncate sm:block">{listing.seller_name}</p>
            {listing.seller_verified && <VerifiedMark className="mt-0.5 hidden sm:inline-flex" label="Verified" />}
            <p className="mt-0.5">{timeAgo(listing.published_at)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
