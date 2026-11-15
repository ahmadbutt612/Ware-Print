import type { Metadata } from "next";
import Link from "next/link";
import { Filters, SortSelect } from "@/components/listings/filters";
import { ListingRow } from "@/components/listings/listing-row";
import { Pagination } from "@/components/listings/pagination";
import { IconX } from "@/components/ui/icons";
import { activeFilterCount, browseHref, PER_PAGE, readFilters, type BrowseFilters } from "@/lib/browse";
import { getCategory } from "@/lib/categories";
import { getFacets, searchListings, type SortKey } from "@/lib/data/listings";
import { CONDITION_LABELS, formatNumber, KIND_LABELS, RUNNING_LABELS } from "@/lib/format";
import type { Condition, ListingKind, OperationalSummary } from "@/lib/types";

function heading(f: BrowseFilters): string {
  const category = getCategory(f.category);
  if (f.kind === "setup") return category ? `Complete setups with ${category.short.toLowerCase()} machines` : "Complete press setups";
  if (category) return category.label;
  if (f.q) return `Results for “${f.q}”`;
  return "All printing & packaging machines";
}

export async function generateMetadata({ searchParams }: PageProps<"/machines">): Promise<Metadata> {
  const f = readFilters(await searchParams);
  const category = getCategory(f.category);
  const title = category
    ? `${category.label} for sale in Pakistan`
    : f.kind === "setup"
      ? "Complete printing & packaging setups for sale"
      : "Printing & packaging machines for sale in Pakistan";
  return {
    title,
    description: category
      ? `Used and new ${category.label.toLowerCase()} (${category.hint.toLowerCase()}) from verified sellers. Every listing reviewed by Ware Print.`
      : "Browse used and new printing and packaging machinery from verified sellers in Pakistan. Every listing reviewed by Ware Print.",
    alternates: { canonical: category ? `/machines?category=${category.slug}` : "/machines" },
    robots: f.q || f.page ? { index: false, follow: true } : undefined,
  };
}

export default async function MachinesPage({ searchParams }: PageProps<"/machines">) {
  const filters = readFilters(await searchParams);
  const page = Number(filters.page || 1);

  const [{ rows, total }, facets] = await Promise.all([
    searchListings({
      q: filters.q,
      category: filters.category,
      kind: filters.kind,
      condition: filters.condition,
      running: filters.running,
      city: filters.city,
      country: filters.country,
      yearMin: filters.year_min ? Number(filters.year_min) : null,
      yearMax: filters.year_max ? Number(filters.year_max) : null,
      withPrice: filters.price === "1",
      sort: (filters.sort || undefined) as SortKey | undefined,
      page,
      perPage: PER_PAGE,
    }),
    getFacets(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const from = total ? (page - 1) * PER_PAGE + 1 : 0;
  const to = Math.min(page * PER_PAGE, total);
  const category = getCategory(filters.category);
  const count = activeFilterCount(filters);

  const chips: { label: string; remove: Partial<BrowseFilters> }[] = [];
  if (filters.q) chips.push({ label: `“${filters.q}”`, remove: { q: "" } });
  if (category) chips.push({ label: category.short, remove: { category: "" } });
  if (filters.kind) chips.push({ label: KIND_LABELS[filters.kind as ListingKind], remove: { kind: "" } });
  if (filters.running) chips.push({ label: RUNNING_LABELS[filters.running as OperationalSummary], remove: { running: "" } });
  if (filters.condition) chips.push({ label: CONDITION_LABELS[filters.condition as Condition], remove: { condition: "" } });
  if (filters.year_min || filters.year_max)
    chips.push({ label: `Year ${filters.year_min || "…"}–${filters.year_max || "…"}`, remove: { year_min: "", year_max: "" } });
  if (filters.city) chips.push({ label: filters.city, remove: { city: "" } });
  if (filters.country) chips.push({ label: filters.country, remove: { country: "" } });
  if (filters.price) chips.push({ label: "With price", remove: { price: "" } });

  return (
    <>
      <div className="border-b border-line bg-paper-2">
        <div className="wrap py-6">
          <nav aria-label="Breadcrumb" className="text-[13px] text-ink-3">
            <Link href="/" className="hover:text-ink hover:underline">
              Home
            </Link>{" "}
            /{" "}
            <Link href="/machines" className="hover:text-ink hover:underline">
              Machines
            </Link>
            {category && <> / {category.short}</>}
          </nav>
          <h1 className="mt-2 font-cond text-[28px] leading-tight font-bold sm:text-[34px]">{heading(filters)}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {category ? `${category.hint}. ` : ""}
            {formatNumber(total)} {total === 1 ? "listing" : "listings"} · every one reviewed by Ware Print before
            publishing
          </p>
        </div>
      </div>

      <div className="wrap grid gap-6 py-6 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside aria-label="Filters">
          <Filters values={filters} facets={facets} activeCount={count} />
        </aside>

        <section aria-label="Results" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <p className="text-sm text-ink-2">
              {total ? (
                <>
                  Showing <span className="tnum font-semibold text-ink">{from}–{to}</span> of{" "}
                  <span className="tnum font-semibold text-ink">{formatNumber(total)}</span>
                </>
              ) : (
                "No matching listings"
              )}
            </p>
            <SortSelect key={filters.sort + filters.q} value={filters.sort} hasQuery={Boolean(filters.q)} />
          </div>

          {chips.length > 0 && (
            <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map((chip) => (
                <li key={chip.label}>
                  <Link
                    href={browseHref({ ...filters, page: "" }, chip.remove)}
                    className="inline-flex items-center gap-1.5 border border-ink bg-paper px-2 py-1 text-[13px] font-medium hover:bg-paper-2"
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    {chip.label} <IconX size={12} />
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/machines" className="link text-[13px] text-ink-2">
                  Clear all
                </Link>
              </li>
            </ul>
          )}

          {rows.length > 0 ? (
            <div className="mt-4 space-y-3">
              {rows.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="mt-4 border border-line bg-paper-2 px-6 py-12 text-center">
              <p className="font-cond text-xl font-bold">
                {facets.total === 0 ? "No machines are listed yet" : "No machines match these filters"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
                {facets.total === 0
                  ? "Listings appear here as soon as the Ware Print team approves them."
                  : page > 1
                    ? "There are no results on this page."
                    : "Try removing a filter or searching for the manufacturer only, e.g. “Heidelberg” instead of a full model number."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {facets.total > 0 && (
                  <Link href="/machines" className="btn btn-outline">
                    Show all machines
                  </Link>
                )}
                <Link href="/sell" className="btn btn-primary">
                  Sell a machine
                </Link>
              </div>
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            hrefFor={(p) => browseHref(filters, { page: p > 1 ? String(p) : "" })}
          />
        </section>
      </div>
    </>
  );
}
