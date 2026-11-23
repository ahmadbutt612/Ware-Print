import type { Metadata } from "next";
import Link from "next/link";
import { DashHeader } from "@/components/dashboard/dash-header";
import { Pagination } from "@/components/listings/pagination";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, INQUIRY_STATUS_LABELS, listingRef } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Inquiry } from "@/lib/types";
import { firstParam, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Inquiries" };

const PER_PAGE = 50;

type Row = Inquiry & { listings: { id: string; ref: number; title: string } | null };

export default async function AdminInquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(firstParam(sp.page)) || 1);

  const admin = createAdminClient();
  const { data, count } = await admin
    .from("inquiries")
    .select("*, listings(id, ref, title)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  const rows = (data ?? []) as Row[];
  const sellerIds = [...new Set(rows.map((r) => r.seller_id))];
  const { data: companies } = sellerIds.length
    ? await admin.from("companies").select("id, name").in("id", sellerIds)
    : { data: [] as { id: string; name: string }[] };
  const companyName = new Map((companies ?? []).map((c) => [c.id, c.name]));
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE));

  return (
    <div className="space-y-6">
      <DashHeader
        eyebrow="Admin"
        title="Inquiries"
        description="Every buyer inquiry sent through Ware Print — your record of which buyers were introduced to which sellers."
      />
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-paper-2 text-left text-[13px] text-ink-2">
            <tr className="border-b border-line">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Listing / seller</th>
              <th className="px-3 py-2 font-medium">Buyer</th>
              <th className="px-3 py-2 font-medium">Message</th>
              <th className="px-3 py-2 font-medium">Delivered</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-ink-3">
                  No inquiries yet.
                </td>
              </tr>
            )}
            {rows.map((q) => (
              <tr key={q.id}>
                <td className="px-3 py-2.5 whitespace-nowrap text-ink-2">{formatDateTime(q.created_at)}</td>
                <td className="px-3 py-2.5">
                  {q.listings && (
                    <Link href={`/admin/listings/${q.listings.id}`} className="hover:underline">
                      <span className="font-mono text-xs text-ink-3">{listingRef(q.listings.ref)}</span>{" "}
                      <span className="line-clamp-1">{q.listings.title}</span>
                    </Link>
                  )}
                  <Link href={`/admin/sellers/${q.seller_id}`} className="block text-xs text-ink-3 hover:underline">
                    {companyName.get(q.seller_id) ?? "Seller"}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <span className="font-medium">{q.buyer_name}</span>
                  {q.buyer_company && <span className="block text-xs text-ink-2">{q.buyer_company}</span>}
                  <span className="block text-xs break-all text-ink-3">{q.buyer_email}</span>
                  <span className="block text-xs text-ink-3">{formatPhone(q.buyer_phone)}</span>
                </td>
                <td className="max-w-xs px-3 py-2.5 text-ink-2">{truncate(q.message, 160)}</td>
                <td className="px-3 py-2.5 text-xs text-ink-2">
                  Email {q.email_sent_at ? "✓" : "—"}
                  <br />
                  WhatsApp {q.sms_sent_at ? "✓" : "—"}
                </td>
                <td className="px-3 py-2.5 text-xs">{INQUIRY_STATUS_LABELS[q.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => (p > 1 ? `/admin/inquiries?page=${p}` : "/admin/inquiries")} />
    </div>
  );
}
