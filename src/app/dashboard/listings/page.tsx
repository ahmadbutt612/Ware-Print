import type { Metadata } from "next";
import Link from "next/link";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Notice } from "@/components/ui/notice";
import { ListingStatusBadge } from "@/components/ui/status";
import { requireAccount } from "@/lib/auth";
import { formatNumber, listingRef, STATUS_LABELS, timeAgo } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import type { Listing, ListingStatus } from "@/lib/types";
import { cn, firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "My listings" };

type Row = Pick<
  Listing,
  "id" | "ref" | "title" | "status" | "view_count" | "updated_at" | "cover_thumb_path" | "kind" | "item_count" | "review_note"
>;

const TABS: { key: string; label: string; statuses: ListingStatus[] }[] = [
  { key: "", label: "All", statuses: [] },
  { key: "live", label: "Published", statuses: ["published"] },
  { key: "review", label: "In review", statuses: ["pending"] },
  { key: "action", label: "Needs action", statuses: ["draft", "changes_requested"] },
  { key: "closed", label: "Sold & removed", statuses: ["sold", "archived", "rejected"] },
];

export default async function MyListingsPage({ searchParams }: PageProps<"/dashboard/listings">) {
  const { onboarding } = await requireAccount("/dashboard/listings");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === firstParam(sp.tab)) ?? TABS[0];

  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("id, ref, title, status, view_count, updated_at, cover_thumb_path, kind, item_count, review_note")
    .order("updated_at", { ascending: false })
    .limit(500);
  const all = (data ?? []) as Row[];
  const rows = tab.statuses.length ? all.filter((l) => tab.statuses.includes(l.status)) : all;
  const { data: inquiryRows } = await supabase.from("inquiries").select("listing_id").limit(5000);
  const inquiryCount = new Map<string, number>();
  for (const r of (inquiryRows ?? []) as { listing_id: string }[]) {
    inquiryCount.set(r.listing_id, (inquiryCount.get(r.listing_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <DashHeader
        eyebrow="Listings"
        title="My listings"
        actions={
          onboarding.complete ? (
            <Link href="/dashboard/listings/new" className="btn btn-primary">
              List a machine
            </Link>
          ) : (
            <Link href="/dashboard" className="btn btn-outline">
              Finish account setup
            </Link>
          )
        }
      />
      {firstParam(sp.deleted) && <Notice tone="ok">The listing was deleted.</Notice>}

      <nav aria-label="Filter listings" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => {
          const n = t.statuses.length ? all.filter((l) => t.statuses.includes(l.status)).length : all.length;
          const active = t.key === tab.key;
          return (
            <Link
              key={t.key}
              href={t.key ? `/dashboard/listings?tab=${t.key}` : "/dashboard/listings"}
              className={cn(
                "relative -mb-px shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap",
                active ? "border-red font-semibold text-ink" : "border-transparent text-ink-2 hover:text-ink",
              )}
            >
              {t.label} <span className="tnum text-ink-3">{n}</span>
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="border border-line bg-paper-2 p-8 text-center">
          <p className="font-semibold">{all.length === 0 ? "You have not listed any machines yet." : "Nothing here."}</p>
          {all.length === 0 && onboarding.complete && (
            <Link href="/dashboard/listings/new" className="btn btn-primary mt-4">
              List your first machine
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-line border border-line">
          {rows.map((l) => {
            const img = mediaUrl(l.cover_thumb_path);
            return (
              <li key={l.id}>
                <Link href={`/dashboard/listings/${l.id}`} className="flex gap-4 p-3 hover:bg-paper-2 sm:p-4">
                  <div className="h-16 w-20 shrink-0 overflow-hidden border border-line bg-paper-2 sm:h-20 sm:w-28">
                    {img && <img src={img} alt="" className="size-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-ink-3">{listingRef(l.ref)}</span>
                      <ListingStatusBadge status={l.status} />
                      {l.kind === "setup" && <span className="text-xs text-ink-3">Setup · {l.item_count} machines</span>}
                    </div>
                    <p className="mt-1 truncate font-semibold">{l.title || "Untitled draft"}</p>
                    {l.status === "changes_requested" && l.review_note && (
                      <p className="mt-0.5 truncate text-sm text-red">Ware Print: {l.review_note}</p>
                    )}
                    <p className="mt-0.5 text-xs text-ink-3">
                      {STATUS_LABELS[l.status]} · updated {timeAgo(l.updated_at)}
                      {l.status === "published" || l.status === "sold"
                        ? ` · ${formatNumber(l.view_count)} views · ${inquiryCount.get(l.id) ?? 0} inquiries`
                        : ""}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
