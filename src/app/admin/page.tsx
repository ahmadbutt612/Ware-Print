import type { Metadata } from "next";
import Link from "next/link";
import { DashHeader, StatTile } from "@/components/dashboard/dash-header";
import { Notice } from "@/components/ui/notice";
import { requireAdmin } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { EVENT_LABELS, formatMoney, isoDaysAgo, listingRef, timeAgo } from "@/lib/format";
import { isSmsConfigured } from "@/lib/sms";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminHome() {
  await requireAdmin();
  const admin = createAdminClient();
  const weekAgo = isoDaysAgo(7);
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);

  const [pending, published, sellers, verified, inquiriesWeek, sales, events] = await Promise.all([
    count(admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending")),
    count(admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "published")),
    count(admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "seller")),
    count(admin.from("companies").select("id", { count: "exact", head: true }).not("verified_at", "is", null)),
    count(admin.from("inquiries").select("id", { count: "exact", head: true }).gte("created_at", weekAgo)),
    admin.from("sales").select("commission_amount, currency, commission_status").in("commission_status", ["due", "invoiced"]),
    admin
      .from("listing_events")
      .select("id, action, note, created_at, listing_id, listings(ref, title)")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const owed = new Map<string, number>();
  for (const s of (sales.data ?? []) as { commission_amount: number | null; currency: string }[]) {
    owed.set(s.currency, (owed.get(s.currency) ?? 0) + Number(s.commission_amount ?? 0));
  }
  const activity = (events.data ?? []) as unknown as {
    id: number;
    action: string;
    note: string | null;
    created_at: string;
    listing_id: string;
    listings: { ref: number; title: string } | null;
  }[];

  return (
    <div className="space-y-8">
      <DashHeader
        eyebrow="Admin"
        title="Overview"
        actions={
          pending > 0 && (
            <Link href="/admin/listings" className="btn btn-primary">
              Review {pending} listing{pending === 1 ? "" : "s"}
            </Link>
          )
        }
      />

      {(!isEmailConfigured() || !isSmsConfigured()) && (
        <Notice tone="warn" title="Setup not finished">
          {!isEmailConfigured() && "Email sending (Resend) is not set up, so sellers and buyers get no emails. "}
          {!isSmsConfigured() &&
            "SMS (Twilio) is not set up, so sellers cannot verify their phone by code — verify them by phone call from the Sellers page."}{" "}
          See SETUP-GUIDE.md.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-5">
        <StatTile label="Waiting for review" value={pending} />
        <StatTile label="Live listings" value={published} />
        <StatTile label="Sellers" value={sellers} note={`${verified} verified`} />
        <StatTile label="Inquiries, 7 days" value={inquiriesWeek} />
        <StatTile
          label="Sales with commission open"
          value={(sales.data ?? []).length}
          note={owed.size === 0 ? "Nothing owed" : [...owed].map(([c, n]) => formatMoney(n, c)).join(" · ")}
        />
      </div>

      <section>
        <h2 className="font-cond text-xl font-bold">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-ink-3">Nothing yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border border-line">
            {activity.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/listings/${e.listing_id}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2.5 hover:bg-paper-2">
                  <span className="w-20 font-mono text-xs text-ink-3">{e.listings ? listingRef(e.listings.ref) : ""}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-medium">{EVENT_LABELS[e.action] ?? e.action}</span>
                    <span className="text-ink-2"> — {e.listings?.title}</span>
                  </span>
                  <span className="text-xs text-ink-3">{timeAgo(e.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
