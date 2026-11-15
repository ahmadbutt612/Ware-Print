import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingChecklist } from "@/components/dashboard/checklist";
import { DashHeader, StatTile } from "@/components/dashboard/dash-header";
import { Notice } from "@/components/ui/notice";
import { ListingStatusBadge } from "@/components/ui/status";
import { requireAccount } from "@/lib/auth";
import { formatNumber, listingRef, timeAgo } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Inquiry, Listing } from "@/lib/types";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

const FLASH: Record<string, string> = {
  company: "Company details saved.",
  phone: "Your mobile number is verified.",
  agreement: "Thank you — your seller oath is signed and saved.",
};

type ListingSummary = Pick<Listing, "id" | "ref" | "title" | "status" | "view_count" | "updated_at">;
type InquirySummary = Pick<Inquiry, "id" | "buyer_name" | "buyer_company" | "created_at" | "status"> & {
  listings: { ref: number; title: string } | null;
};

export default async function DashboardHome({ searchParams }: PageProps<"/dashboard">) {
  const account = await requireAccount();
  const sp = await searchParams;
  const flash = FLASH[firstParam(sp.saved)] ?? (firstParam(sp.password) === "updated" ? "Your password was changed." : null);

  const supabase = await createClient();
  const [{ data: listingData }, { data: inquiryData }] = await Promise.all([
    supabase
      .from("listings")
      .select("id, ref, title, status, view_count, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("inquiries")
      .select("id, buyer_name, buyer_company, created_at, status, listings(ref, title)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const listings = (listingData ?? []) as ListingSummary[];
  const inquiries = (inquiryData ?? []) as unknown as InquirySummary[];
  const by = (status: Listing["status"]) => listings.filter((l) => l.status === status).length;
  const views = listings.reduce((sum, l) => sum + (l.view_count ?? 0), 0);
  const { onboarding } = account;
  const firstName = account.profile.full_name.split(" ")[0];

  return (
    <div className="space-y-8">
      <DashHeader
        eyebrow="Overview"
        title={firstName ? `Welcome, ${firstName}` : "Your seller dashboard"}
        actions={
          onboarding.complete && (
            <Link href="/dashboard/listings/new" className="btn btn-primary">
              List a machine
            </Link>
          )
        }
      />

      {flash && <Notice tone="ok">{flash}</Notice>}
      {onboarding.suspended && (
        <Notice tone="error" title="Your seller account is suspended">
          Your listings are hidden and you cannot submit new ones. Please contact Ware Print.
        </Notice>
      )}

      {!onboarding.complete && !onboarding.suspended && <OnboardingChecklist onboarding={onboarding} />}

      {onboarding.complete && listings.length === 0 && (
        <section className="border border-ink p-6">
          <h2 className="font-cond text-xl font-bold">Your account is ready</h2>
          <p className="mt-1 max-w-xl text-sm text-ink-2">
            List your first machine. Add clear photos, a short video if you have one, and the specifications buyers ask
            about. Ware Print reviews it before it goes live — usually within one working day.
          </p>
          <Link href="/dashboard/listings/new" className="btn btn-primary mt-4">
            List a machine
          </Link>
        </section>
      )}

      {listings.length > 0 && (
        <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
          <StatTile label="Published" value={by("published")} />
          <StatTile label="In review" value={by("pending")} />
          <StatTile label="Needs changes" value={by("changes_requested")} />
          <StatTile label="Listing views" value={formatNumber(views)} />
        </div>
      )}

      {listings.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-cond text-xl font-bold">Recent listings</h2>
            <Link href="/dashboard/listings" className="link text-sm">
              All listings
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line border border-line">
            {listings.slice(0, 5).map((l) => (
              <li key={l.id}>
                <Link href={`/dashboard/listings/${l.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-paper-2">
                  <span className="w-20 font-mono text-xs text-ink-3">{listingRef(l.ref)}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{l.title || "Untitled draft"}</span>
                  <ListingStatusBadge status={l.status} />
                  <span className="w-24 text-right text-xs text-ink-3">{timeAgo(l.updated_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {inquiries.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-cond text-xl font-bold">Latest inquiries</h2>
            <Link href="/dashboard/inquiries" className="link text-sm">
              All inquiries
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line border border-line">
            {inquiries.map((q) => (
              <li key={q.id}>
                <Link href="/dashboard/inquiries" className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-paper-2">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{q.buyer_name}</span>
                    {q.buyer_company && <span className="text-ink-3"> · {q.buyer_company}</span>}
                    <span className="block truncate text-xs text-ink-3">
                      {q.listings ? `${listingRef(q.listings.ref)} — ${q.listings.title}` : ""}
                    </span>
                  </span>
                  {q.status === "new" && <span className="bg-red px-1.5 text-xs leading-5 font-semibold text-white">New</span>}
                  <span className="text-xs text-ink-3">{timeAgo(q.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
