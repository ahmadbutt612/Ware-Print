import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, CATEGORY_GROUPS } from "@/lib/categories";
import { getFacets } from "@/lib/data/listings";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "All machine categories",
  description: "Printing, converting, packaging and pre-press machinery categories on Ware Print.",
};

export default async function CategoriesPage() {
  const facets = await getFacets();

  return (
    <>
      <div className="border-b border-line bg-paper-2">
        <div className="wrap py-8">
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-1 font-cond text-[34px] font-bold">All machine categories</h1>
          <p className="mt-1 text-ink-2">
            {formatNumber(facets.total)} listings in {CATEGORIES.length} categories.{" "}
            <Link href="/machines?kind=setup" className="link">
              Complete setups
            </Link>{" "}
            appear under every machine type they include.
          </p>
        </div>
      </div>
      <div className="wrap grid gap-10 py-10 md:grid-cols-2">
        {CATEGORY_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`} className="eyebrow border-b border-ink pb-2 text-ink">
              {group.label}
            </h2>
            <ul className="divide-y divide-line">
              {CATEGORIES.filter((c) => c.group === group.id).map((c) => (
                <li key={c.slug}>
                  <Link href={`/machines?category=${c.slug}`} className="group flex items-center justify-between gap-4 py-3">
                    <span>
                      <span className="block font-semibold group-hover:text-red group-hover:underline">{c.label}</span>
                      <span className="block text-sm text-ink-3">{c.hint}</span>
                    </span>
                    <span className="tnum shrink-0 text-sm text-ink-2">{facets.categories[c.slug] ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
