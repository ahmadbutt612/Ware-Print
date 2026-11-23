import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { ListingTile } from "@/components/listings/listing-tile";
import { ListingView } from "@/components/listings/listing-view";
import { Notice } from "@/components/ui/notice";
import { getUser } from "@/lib/auth";
import { categorySingular } from "@/lib/categories";
import { getListingByRef, getPublicCompany, getSimilarListings } from "@/lib/data/listings";
import { formatMoney, listingPath, listingRef, STATUS_LABELS } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { absoluteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { truncate } from "@/lib/utils";

function parseParam(param: string): { ref: number; slug: string } | null {
  const m = /^(\d{1,12})(?:-(.*))?$/.exec(param);
  return m ? { ref: Number(m[1]), slug: m[2] ?? "" } : null;
}

export async function generateMetadata({ params }: PageProps<"/machines/[ref]">): Promise<Metadata> {
  const parsed = parseParam((await params).ref);
  if (!parsed) return {};
  const listing = await getListingByRef(parsed.ref);
  if (!listing) return { title: "Listing not found" };
  const isPublic = listing.status === "published" || listing.status === "sold";
  const price =
    listing.price_type !== "on_request" && listing.price_amount
      ? formatMoney(listing.price_amount, listing.price_currency)
      : "Price on request";
  const description = truncate(
    [
      listing.kind === "setup" ? `Complete setup of ${listing.item_count} machines` : categorySingular(listing.primary_category),
      listing.year ? `Year ${listing.year}` : null,
      `${listing.city}, ${listing.country}`,
      price,
      listing.description,
    ]
      .filter(Boolean)
      .join(" · "),
    300,
  );
  const image = mediaUrl(listing.cover_path);
  return {
    title: `${listing.title} — ${listingRef(listing.ref)}`,
    description,
    alternates: { canonical: listingPath(listing.ref, listing.slug) },
    robots: isPublic ? undefined : { index: false, follow: false },
    openGraph: {
      title: listing.title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ListingPage({ params }: PageProps<"/machines/[ref]">) {
  const parsed = parseParam((await params).ref);
  if (!parsed) notFound();
  const listing = await getListingByRef(parsed.ref);
  if (!listing) notFound();

  if (listing.slug && parsed.slug !== listing.slug) redirect(listingPath(listing.ref, listing.slug));

  const isPublic = listing.status === "published" || listing.status === "sold";
  // Seller, viewer and similar machines are independent: fetch them together.
  const [company, user, similar] = await Promise.all([
    getPublicCompany(listing.seller_id),
    getUser(),
    isPublic ? getSimilarListings(listing.primary_category, listing.id) : Promise.resolve([]),
  ]);
  const isOwner = user?.id === listing.seller_id;

  if (listing.status === "published" && !isOwner) {
    const h = await headers();
    const isPrefetch = h.get("next-router-prefetch") || h.get("purpose") === "prefetch";
    if (!isPrefetch) {
      after(async () => {
        await createAdminClient().rpc("increment_listing_views", { p_listing: listing.id });
      });
    }
  }

  const banner = !isPublic ? (
    <Notice tone="warn" title="Preview — buyers cannot see this listing">
      Status: {STATUS_LABELS[listing.status]}.{" "}
      <Link href={`/dashboard/listings/${listing.id}`} className="link">
        Back to your listing
      </Link>
    </Notice>
  ) : isOwner ? (
    <Notice title="This is your listing">
      Buyers see it exactly like this.{" "}
      <Link href={`/dashboard/listings/${listing.id}`} className="link">
        Manage listing
      </Link>
    </Notice>
  ) : null;


  const conditionSchema = {
    new: "https://schema.org/NewCondition",
    used: "https://schema.org/UsedCondition",
    refurbished: "https://schema.org/RefurbishedCondition",
  } as const;
  const jsonLd = isPublic
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: listing.title,
        sku: listingRef(listing.ref),
        description: truncate(listing.description || listing.title, 500),
        image: listing.listing_media
          .filter((m) => m.kind === "image")
          .map((m) => mediaUrl(m.storage_path))
          .filter(Boolean),
        brand: listing.manufacturer ? { "@type": "Brand", name: listing.manufacturer } : undefined,
        model: listing.model || undefined,
        itemCondition: listing.condition ? conditionSchema[listing.condition] : undefined,
        offers:
          listing.price_type !== "on_request" && listing.price_amount
            ? {
                "@type": "Offer",
                price: listing.price_amount,
                priceCurrency: listing.price_currency,
                availability: listing.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
                url: absoluteUrl(listingPath(listing.ref, listing.slug)),
                seller: company ? { "@type": "Organization", name: company.name } : undefined,
              }
            : undefined,
      }
    : null;

  return (
    <>
      <ListingView listing={listing} company={company} inquiry={!isOwner} banner={banner} />
      {similar.length > 0 && (
        <section className="wrap pb-6" aria-labelledby="similar-heading">
          <div className="flex items-end justify-between gap-4 border-t border-line pt-8">
            <h2 id="similar-heading" className="font-cond text-2xl font-bold">
              Similar machines
            </h2>
            <Link href={`/machines?category=${listing.primary_category}`} className="link text-sm">
              View all
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {similar.map((s) => (
              <ListingTile key={s.id} listing={s} />
            ))}
          </div>
        </section>
      )}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
    </>
  );
}
