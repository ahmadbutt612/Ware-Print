"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { IconDown } from "@/components/ui/icons";
import type { BrowseFilters } from "@/lib/browse";
import { startProgress } from "@/components/site/navigation-progress";
import { CATEGORIES, CATEGORY_GROUPS } from "@/lib/categories";
import type { Facets } from "@/lib/types";
import { cn } from "@/lib/utils";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-line px-4 py-4 last:border-b-0">
      <legend className="sr-only">{title}</legend>
      <p className="eyebrow mb-2.5 text-ink-2">{title}</p>
      {children}
    </fieldset>
  );
}

function Option({
  name,
  value,
  label,
  count,
  checked,
  type = "radio",
}: {
  name: string;
  value: string;
  label: ReactNode;
  count?: number;
  checked: boolean;
  type?: "radio" | "checkbox";
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-[3px] text-sm text-ink-2 hover:text-ink has-[:checked]:font-medium has-[:checked]:text-ink">
      <input type={type} name={name} value={value} defaultChecked={checked} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="tnum text-xs text-ink-3">{count}</span>}
    </label>
  );
}

export function Filters({ values, facets, activeCount }: { values: BrowseFilters; facets: Facets; activeCount: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  function apply(form: HTMLFormElement) {
    // Includes the sort menu above the results, which joins this form via form="filters".
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    }
    const qs = params.toString();
    const next = qs ? `/machines?${qs}` : "/machines";
    if (next !== window.location.pathname + window.location.search) startProgress();
    router.push(next, { scroll: false });
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-outline w-full justify-between lg:hidden"
        aria-expanded={open}
        aria-controls="filters"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Filters{activeCount ? ` (${activeCount})` : ""}</span>
        <IconDown className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <form
        // Remount when the URL changes (e.g. a header category link) so the inputs match it.
        key={JSON.stringify(values)}
        id="filters"
        ref={formRef}
        action="/machines"
        method="get"
        className={cn("mt-3 border border-line bg-paper lg:mt-0 lg:block", open ? "block" : "hidden")}
        onSubmit={(e) => {
          e.preventDefault();
          apply(e.currentTarget);
        }}
        onChange={(e) => {
          const t = e.target as unknown as HTMLInputElement | HTMLSelectElement;
          if (t.type === "radio" || t.type === "checkbox" || t.tagName === "SELECT") apply(e.currentTarget);
        }}
      >
        <Group title="Keyword">
          <input
            name="q"
            type="search"
            defaultValue={values.q}
            placeholder="Make, model, feature…"
            className="field-input"
            aria-label="Keyword"
          />
        </Group>

        <Group title="Listing type">
          <Option name="kind" value="" label="All listings" checked={!values.kind} />
          <Option name="kind" value="single" label="Single machines" count={facets.kinds.single ?? 0} checked={values.kind === "single"} />
          <Option name="kind" value="setup" label="Complete setups" count={facets.kinds.setup ?? 0} checked={values.kind === "setup"} />
        </Group>

        <Group title="Machine type">
          <Option name="category" value="" label="All machine types" checked={!values.category} />
          {CATEGORIES.filter((c) => (facets.categories[c.slug] ?? 0) > 0 || values.category === c.slug).map((c) => (
            <Option
              key={c.slug}
              name="category"
              value={c.slug}
              label={c.label}
              count={facets.categories[c.slug] ?? 0}
              checked={values.category === c.slug}
            />
          ))}
          {CATEGORIES.some((c) => !facets.categories[c.slug] && values.category !== c.slug) && (
            <details className="mt-2">
              <summary className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-ink">
                Show types with no listings yet
              </summary>
              {CATEGORY_GROUPS.map((group) => {
                const empty = CATEGORIES.filter(
                  (c) => c.group === group.id && !facets.categories[c.slug] && values.category !== c.slug,
                );
                if (empty.length === 0) return null;
                return (
                  <div key={group.id} className="mt-2.5">
                    <p className="mb-1 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">{group.label}</p>
                    {empty.map((c) => (
                      <Option key={c.slug} name="category" value={c.slug} label={c.label} count={0} checked={false} />
                    ))}
                  </div>
                );
              })}
            </details>
          )}
        </Group>

        <Group title="Running status">
          <Option name="running" value="" label="Any" checked={!values.running} />
          <Option name="running" value="running" label="Running" count={facets.running.running ?? 0} checked={values.running === "running"} />
          <Option
            name="running"
            value="not_running"
            label="Not running"
            count={facets.running.not_running ?? 0}
            checked={values.running === "not_running"}
          />
          <Option
            name="running"
            value="partly_running"
            label="Partly running (setups)"
            count={facets.running.partly_running ?? 0}
            checked={values.running === "partly_running"}
          />
        </Group>

        <Group title="Condition">
          <Option name="condition" value="" label="Any" checked={!values.condition} />
          <Option name="condition" value="used" label="Used" count={facets.conditions.used ?? 0} checked={values.condition === "used"} />
          <Option
            name="condition"
            value="refurbished"
            label="Refurbished"
            count={facets.conditions.refurbished ?? 0}
            checked={values.condition === "refurbished"}
          />
          <Option name="condition" value="new" label="New" count={facets.conditions.new ?? 0} checked={values.condition === "new"} />
        </Group>

        <Group title="Year of manufacture">
          <div className="flex items-center gap-2">
            <input
              name="year_min"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2100}
              placeholder="From"
              defaultValue={values.year_min}
              aria-label="Year from"
              className="field-input"
            />
            <span className="text-ink-3">–</span>
            <input
              name="year_max"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2100}
              placeholder="To"
              defaultValue={values.year_max}
              aria-label="Year to"
              className="field-input"
            />
          </div>
        </Group>

        <Group title="Location">
          <select name="city" defaultValue={values.city} aria-label="City" className="field-input">
            <option value="">All cities</option>
            {facets.cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.n})
              </option>
            ))}
            {values.city && !facets.cities.some((c) => c.name === values.city) && (
              <option value={values.city}>{values.city}</option>
            )}
          </select>
          {facets.countries.length > 1 && (
            <select name="country" defaultValue={values.country} aria-label="Country" className="field-input mt-2">
              <option value="">All countries</option>
              {facets.countries.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.n})
                </option>
              ))}
            </select>
          )}
        </Group>

        <Group title="Price">
          <Option name="price" value="1" type="checkbox" label="Only listings that show a price" checked={values.price === "1"} />
        </Group>

        <div className="flex gap-2 border-t border-line p-4">
          <button type="submit" className="btn btn-dark flex-1">
            Apply filters
          </button>
          <Link href="/machines" className="btn btn-outline">
            Clear
          </Link>
        </div>
      </form>
    </div>
  );
}

export function SortSelect({ value, hasQuery }: { value: string; hasQuery: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      <span className="whitespace-nowrap">Sort by</span>
      <select
        name="sort"
        form="filters"
        defaultValue={value || (hasQuery ? "relevance" : "newest")}
        className="field-input h-9 min-h-9 w-auto py-1 text-sm"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {hasQuery && <option value="relevance">Best match</option>}
        <option value="newest">Newest listed</option>
        <option value="year_desc">Year: newest machine</option>
        <option value="year_asc">Year: oldest machine</option>
      </select>
    </label>
  );
}
