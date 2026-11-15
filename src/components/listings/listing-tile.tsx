import Link from "next/link";
import { NoPhoto } from "@/components/listings/no-photo";
import { PriceLine } from "@/components/listings/price";
import { RunningChip } from "@/components/ui/status";
import { getCategory } from "@/lib/categories";
import { listingPath, placeName } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { ListingCard } from "@/lib/types";

/** Grid card used on the home page and "similar machines". */
export function ListingTile({ listing }: { listing: ListingCard }) {
  const img = mediaUrl(listing.cover_thumb_path);
  const meta =
    listing.kind === "setup"
      ? `Setup · ${listing.item_count} machines`
      : [getCategory(listing.primary_category)?.short, listing.year].filter(Boolean).join(" · ");

  return (
    <Link
      href={listingPath(listing.ref, listing.slug)}
      className="group flex flex-col border border-line bg-paper transition-colors hover:border-ink"
    >
      <div className="aspect-[4/3] overflow-hidden border-b border-line bg-paper-2">
        {img ? <img src={img} alt="" loading="lazy" className="size-full object-cover" /> : <NoPhoto />}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <p className={listing.kind === "setup" ? "eyebrow truncate text-red" : "eyebrow truncate"}>{meta}</p>
        <h3 className="mt-1 line-clamp-2 text-[15px] leading-snug font-semibold text-ink group-hover:underline">
          {listing.title}
        </h3>
        <p className="mt-1 truncate text-[13px] text-ink-3">{placeName(listing.city, listing.country)}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <RunningChip status={listing.operational_status} />
        </div>
        <div className="mt-auto pt-3">
          <PriceLine
            type={listing.price_type}
            amount={listing.price_amount}
            currency={listing.price_currency}
            className="border-t border-line pt-2.5"
          />
        </div>
      </div>
    </Link>
  );
}
