import Link from "next/link";
import { ListingTile } from "@/components/listings/listing-tile";
import { SearchForm } from "@/components/site/header-search";
import { LineDiagram } from "@/components/site/line-diagram";
import { IconArrowRight, IconClipboard, IconEye, IconGauge, IconShield } from "@/components/ui/icons";
import { getAccount } from "@/lib/auth";
import { CATEGORIES, CATEGORY_GROUPS } from "@/lib/categories";
import { getFacets, searchListings } from "@/lib/data/listings";
import { formatNumber } from "@/lib/format";

const trust = [
  {
    icon: IconShield,
    title: "Verified sellers",
    body: "Every seller confirms their email address and mobile number, and signs the Ware Print seller oath.",
  },
  {
    icon: IconClipboard,
    title: "Every listing reviewed",
    body: "Our team checks that each machine is genuine and printing or packaging related before it is published.",
  },
  {
    icon: IconGauge,
    title: "Running status stated",
    body: "Sellers must say whether each machine is running right now — and note any faults.",
  },
  {
    icon: IconEye,
    title: "Inspect & quote",
    body: "Ask the seller for their best price, a video of the machine running, or an inspection visit.",
  },
];

export default async function HomePage() {
  const [facets, latest, account] = await Promise.all([getFacets(), searchListings({ perPage: 8 }), getAccount()]);
  const sellHref = account ? "/dashboard/listings/new" : "/signup";

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="wrap grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14 lg:py-16">
          <div className="min-w-0">
            <p className="eyebrow text-red">Verified inventory · Pakistan</p>
            <h1 className="mt-3 max-w-3xl font-cond text-[34px] leading-[1.05] font-bold tracking-[-0.01em] text-balance sm:text-[46px] lg:text-[54px]">
              Printing and packaging machines, checked before they are listed.
            </h1>
            <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-2">
              Offset presses, flexo and rotogravure lines, die cutters, slitters and complete production setups from
              sellers across Pakistan. Ware Print reviews every listing before buyers see it.
            </p>

            <div className="crop mt-8 max-w-2xl border border-ink bg-paper p-4 sm:p-5">
              <p className="mb-2.5 text-sm font-semibold">Search machines</p>
              <SearchForm />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-2">
                <span className="text-ink-3">Popular:</span>
                {[
                  ["offset-printing", "Offset presses"],
                  ["flexo-printing", "Flexo"],
                  ["die-cutting", "Die cutting"],
                  ["slitting-rewinding", "Slitter rewinders"],
                  ["bag-pouch-making", "Bag making"],
                ].map(([slug, label]) => (
                  <Link key={slug} href={`/machines?category=${slug}`} className="link">
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {facets.total > 0 && (
              <p className="mt-6 text-sm text-ink-2">
                <span className="tnum font-semibold text-ink">{formatNumber(facets.total)}</span> machines listed by{" "}
                <span className="tnum font-semibold text-ink">{formatNumber(facets.sellers)}</span> verified{" "}
                {facets.sellers === 1 ? "seller" : "sellers"}
              </p>
            )}
          </div>

          <aside className="self-start border border-line bg-paper-2">
            <div className="border-b border-line p-5">
              <p className="eyebrow">For sellers</p>
              <h2 className="mt-1.5 font-cond text-[22px] leading-tight font-bold">
                Free to list. 2% commission only when it sells.
              </h2>
            </div>
            <ol className="divide-y divide-line">
              {[
                "Create an account and verify your email and mobile number.",
                "Add photos, videos and the machine’s specifications.",
                "Ware Print checks the listing before it is published.",
                "Buyers send inquiries straight to your email and phone.",
              ].map((step, i) => (
                <li key={step} className="flex gap-3 px-5 py-3 text-sm">
                  <span className="font-mono text-xs leading-5 font-medium text-red">0{i + 1}</span>
                  <span className="text-ink-2">{step}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-3 border-t border-line p-5">
              <Link href={sellHref} className="btn btn-primary">
                Start selling
              </Link>
              <Link href="/sell" className="link text-sm">
                How it works
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-line bg-paper-2" aria-label="Why buy on Ware Print">
        <div className="wrap grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {trust.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className={`py-6 sm:px-5 ${i % 2 === 1 ? "sm:border-l sm:border-line" : ""} ${i > 1 ? "sm:border-t lg:border-t-0" : ""} ${i > 0 ? "lg:border-l lg:border-line" : "lg:pl-0"}`}
            >
              <Icon size={20} className="text-red" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-ink-2">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest */}
      <section className="wrap py-12" aria-labelledby="latest-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Just approved</p>
            <h2 id="latest-heading" className="mt-1 font-cond text-[28px] font-bold">
              Latest machines
            </h2>
          </div>
          {facets.total > 0 && (
            <Link href="/machines" className="link inline-flex items-center gap-1.5 text-sm font-medium">
              View all {formatNumber(facets.total)} <IconArrowRight size={14} />
            </Link>
          )}
        </div>
        {latest.rows.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {latest.rows.map((listing) => (
              <ListingTile key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-start gap-4 border border-line bg-paper-2 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">No machines are listed yet.</p>
              <p className="mt-1 text-sm text-ink-2">
                Approved listings appear here first. Sellers can list a machine in about ten minutes.
              </p>
            </div>
            <Link href={sellHref} className="btn btn-primary">
              List a machine
            </Link>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="border-y border-line bg-paper-2" aria-labelledby="categories-heading">
        <div className="wrap py-12">
          <div className="flex items-end justify-between gap-4">
            <h2 id="categories-heading" className="font-cond text-[28px] font-bold">
              Browse by machine type
            </h2>
            <Link href="/categories" className="link text-sm">
              All categories
            </Link>
          </div>
          <div className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_GROUPS.map((group) => (
              <div key={group.id}>
                <h3 className="eyebrow border-b border-ink pb-2 text-ink">{group.label}</h3>
                <ul className="divide-y divide-line">
                  {CATEGORIES.filter((c) => c.group === group.id).map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/machines?category=${c.slug}`}
                        className="group flex items-baseline justify-between gap-3 py-2 text-sm"
                      >
                        <span className="text-ink group-hover:text-red group-hover:underline">{c.label}</span>
                        <span className="tnum text-xs text-ink-3">{facets.categories[c.slug] ?? 0}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Complete setups */}
      <section className="wrap py-14" aria-labelledby="setups-heading">
        <div className="grid items-center gap-8 border border-line p-6 sm:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <p className="eyebrow text-red">Complete setups</p>
            <h2 id="setups-heading" className="mt-1.5 font-cond text-[28px] leading-tight font-bold">
              Buying or selling a whole line?
            </h2>
            <p className="mt-3 text-ink-2">
              List a flexo press together with its die cutter and slitter as one setup. Each machine gets its own model,
              year, specifications and running status, so buyers know exactly what comes with the line.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/machines?kind=setup" className="btn btn-dark">
                Browse complete setups
              </Link>
              <Link href={sellHref} className="btn btn-outline">
                List a setup
              </Link>
            </div>
          </div>
          <LineDiagram className="w-full" />
        </div>
      </section>

      {/* How buying works */}
      <section className="border-t border-line" aria-labelledby="buying-heading">
        <div className="wrap py-12">
          <h2 id="buying-heading" className="font-cond text-[28px] font-bold">
            How buying works
          </h2>
          <ol className="mt-6 grid gap-px border border-line bg-line md:grid-cols-3">
            {[
              ["Find the machine", "Filter by machine type, running status, year and city. Every listing shows the model and full specifications."],
              ["Ask the seller", "Send an inquiry from the listing. It goes to the seller by email and WhatsApp, and they reply to you directly."],
              ["Inspect and agree", "Visit the machine, see it running, and agree the price and payment terms with the seller."],
            ].map(([title, body], i) => (
              <li key={title} className="bg-paper p-6">
                <span className="font-mono text-sm font-medium text-red">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-2">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Seller band (pulls the footer up so the dark band meets it) */}
      <section className="-mb-20 bg-ink text-white">
        <div className="wrap flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-cond text-[28px] leading-tight font-bold">Selling a printing or packaging machine?</h2>
            <p className="mt-2 text-white/75">
              List it free. You pay 2% commission only when it sells to a buyer introduced by Ware Print.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={sellHref} className="btn btn-primary btn-lg">
              Create seller account
            </Link>
            <Link href="/seller-agreement" className="btn btn-lg border-white/40 text-white hover:border-white">
              Read the seller oath
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
