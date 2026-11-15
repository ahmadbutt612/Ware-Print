import type { Metadata } from "next";
import Link from "next/link";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Notice } from "@/components/ui/notice";
import { ListingStatusBadge } from "@/components/ui/status";
import { requireAdmin } from "@/lib/auth";
import { categorySingular } from "@/lib/categories";
import { formatDateTime, listingRef, timeAgo } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Listing, ListingStatus } from "@/lib/types";
import { cn, firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Listings" };

const TABS: { key: ListingStatus | "all"; label: string }[] = [
  { key: "pending", label: "Waiting for review" },
  { key: "changes_requested", label: "Changes requested" },
  { key: "published", label: "Published" },
  { key: "sold", label: "Sold" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Removed" },
  { key: "draft", label: "Drafts" },
  { key: "all", label: "All" },
];

const DONE: Record<string, string> = {
  approve: "approved and published",
  changes: "sent back to the seller for changes",
  reject: "rejected",
};

type Row = Pick<
  Listing,
  "id" | "ref" | "title" | "status" | "kind" | "item_count" | "city" | "primary_category" | "seller_id" | "submitted_at" | "updated_at" | "cover_thumb_path"
>;

export default async function AdminListingsPage({ searchParams }: PageProps<"/admin/listings">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === firstParam(sp.status)) ?? TABS[0];
  const q = firstParam(sp.q).trim().slice(0, 80);
  const done = DONE[firstParam(sp.done)];

  const admin = createAdminClient();
  let query = admin
    .from("listings")
    .select("id, ref, title, status, kind, item_count, city, primary_category, seller_id, submitted_at, updated_at, cover_thumb_path")
    .limit(200);
  if (tab.key !== "all") query = query.eq("status", tab.key);
  if (q) {
    const ref = Number(q.replace(/^wp-?/i, ""));
    query = Number.isInteger(ref) && ref > 0 ? query.eq("ref", ref) : query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
  }
  query = tab.key === "pending" ? query.order("submitted_at", { ascending: true }) : query.order("updated_at", { ascending: false });
  const [{ data }, { data: counts }] = await Promise.all([query, admin.from("listings").select("status").limit(10000)]);
  const rows = (data ?? []) as Row[];

  const sellerIds = [...new Set(rows.map((r) => r.seller_id))];
  const { data: companies } = sellerIds.length
    ? await admin.from("companies").select("id, name").in("id", sellerIds)
    : { data: [] as { id: string; name: string }[] };
  const companyName = new Map((companies ?? []).map((c) => [c.id, c.name]));
  const countBy = new Map<string, number>();
  for (const r of (counts ?? []) as { status: string }[]) countBy.set(r.status, (countBy.get(r.status) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <DashHeader
        eyebrow="Admin"
        title="Listings"
        description="New and edited listings wait here until you approve them. Oldest submissions are shown first."
      />
      {done && (
        <Notice tone="ok">
          Listing {listingRef(firstParam(sp.ref))} was {done}. The seller has been emailed.
        </Notice>
      )}

      <form className="flex max-w-md" action="/admin/listings">
        <input type="hidden" name="status" value={tab.key} />
        <input name="q" defaultValue={q} placeholder="Search title or reference (WP-10001)" aria-label="Search listings" className="field-input rounded-r-none border-r-0" />
        <button className="btn btn-dark rounded-l-none">Search</button>
      </form>

      <nav aria-label="Listing status" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/listings?status=${t.key}`}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap",
              t.key === tab.key ? "border-red font-semibold text-ink" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {t.label}{" "}
            <span className="tnum text-ink-3">{t.key === "all" ? (counts ?? []).length : (countBy.get(t.key) ?? 0)}</span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="border border-line bg-paper-2 p-8 text-center text-sm text-ink-2">
          {tab.key === "pending" ? "Nothing waiting for review." : "No listings here."}
        </div>
      ) : (
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-paper-2 text-left text-[13px] text-ink-2">
              <tr className="border-b border-line">
                <th className="px-3 py-2 font-medium">Listing</th>
                <th className="px-3 py-2 font-medium">Seller</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">{tab.key === "pending" ? "Submitted" : "Updated"}</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const img = mediaUrl(r.cover_thumb_path);
                return (
                  <tr key={r.id} className="hover:bg-paper-2">
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/listings/${r.id}`} className="flex items-center gap-3">
                        <span className="h-10 w-14 shrink-0 overflow-hidden border border-line bg-paper-2">
                          {img && <img src={img} alt="" className="size-full object-cover" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-mono text-xs text-ink-3">{listingRef(r.ref)}</span>
                          <span className="line-clamp-1 font-medium hover:underline">{r.title || "Untitled"}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/sellers/${r.seller_id}`} className="hover:underline">
                        {companyName.get(r.seller_id) || "—"}
                      </Link>
                      <span className="block text-xs text-ink-3">{r.city}</span>
                    </td>
                    <td className="px-3 py-2.5 text-ink-2">
                      {r.kind === "setup" ? `Setup · ${r.item_count}` : categorySingular(r.primary_category)}
                    </td>
                    <td className="px-3 py-2.5 text-ink-2" title={formatDateTime(tab.key === "pending" ? r.submitted_at : r.updated_at)}>
                      {timeAgo(tab.key === "pending" ? r.submitted_at : r.updated_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      <ListingStatusBadge status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
