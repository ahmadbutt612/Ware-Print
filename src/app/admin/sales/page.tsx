import type { Metadata } from "next";
import Link from "next/link";
import { updateSale } from "@/actions/admin";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ActionForm, FormMessage, PendingButton } from "@/components/ui/action-form";
import { requireAdmin } from "@/lib/auth";
import { COMMISSION_STATUS_LABELS, formatDate, formatMoney, listingRef } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CommissionStatus, Sale } from "@/lib/types";

export const metadata: Metadata = { title: "Sales & commission" };

type Row = Sale & { listings: { id: string; ref: number; title: string } | null };

export default async function AdminSalesPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("sales")
    .select("*, listings(id, ref, title)")
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Row[];
  const sellerIds = [...new Set(rows.map((r) => r.seller_id))];
  const { data: companies } = sellerIds.length
    ? await admin.from("companies").select("id, name").in("id", sellerIds)
    : { data: [] as { id: string; name: string }[] };
  const companyName = new Map((companies ?? []).map((c) => [c.id, c.name]));

  const sum = (statuses: CommissionStatus[]) => {
    const totals = new Map<string, number>();
    for (const r of rows) {
      if (statuses.includes(r.commission_status) && r.commission_amount) {
        totals.set(r.currency, (totals.get(r.currency) ?? 0) + Number(r.commission_amount));
      }
    }
    return [...totals].map(([c, n]) => formatMoney(n, c)).join(" · ") || "—";
  };

  return (
    <div className="space-y-6">
      <DashHeader
        eyebrow="Admin"
        title="Sales & commission"
        description="Sales reported by sellers. Commission is 2% of the sale price when the buyer came through Ware Print. Compare “found elsewhere” sales with the inquiries for that listing."
      />

      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-paper p-4">
          <p className="text-[13px] text-ink-2">Due (not invoiced)</p>
          <p className="tnum mt-1 font-semibold">{sum(["due"])}</p>
        </div>
        <div className="bg-paper p-4">
          <p className="text-[13px] text-ink-2">Invoiced, awaiting payment</p>
          <p className="tnum mt-1 font-semibold">{sum(["invoiced"])}</p>
        </div>
        <div className="bg-paper p-4">
          <p className="text-[13px] text-ink-2">Paid</p>
          <p className="tnum mt-1 font-semibold">{sum(["paid"])}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border border-line bg-paper-2 p-8 text-center text-sm text-ink-2">
          No sales reported yet. Sellers report a sale with “Mark as sold” on their listing.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-4 border border-line p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 text-sm">
                <p className="text-xs text-ink-3">Reported {formatDate(r.created_at)}</p>
                {r.listings && (
                  <Link href={`/admin/listings/${r.listings.id}`} className="mt-0.5 block font-medium hover:underline">
                    <span className="font-mono text-xs text-ink-3">{listingRef(r.listings.ref)}</span> {r.listings.title}
                  </Link>
                )}
                <p className="mt-1 text-ink-2">
                  Seller:{" "}
                  <Link href={`/admin/sellers/${r.seller_id}`} className="link">
                    {companyName.get(r.seller_id) ?? "—"}
                  </Link>
                  {r.buyer_name && <> · Buyer: {r.buyer_name}</>}
                </p>
                <p className="mt-1">
                  {r.sold_via_wareprint ? (
                    <span className="font-semibold text-ok">Buyer came through Ware Print</span>
                  ) : (
                    <span className="font-semibold text-warn">Seller says buyer was found elsewhere</span>
                  )}
                </p>
                <p className="tnum mt-1">
                  Sale price {r.sale_price ? formatMoney(r.sale_price, r.currency) : "not given"} · Commission{" "}
                  <strong>{r.commission_amount ? formatMoney(r.commission_amount, r.currency) : "—"}</strong>
                </p>
                {r.notes && <p className="mt-1 text-ink-2">Seller&apos;s note: {r.notes}</p>}
              </div>
              <ActionForm action={updateSale} className="space-y-2">
                <input type="hidden" name="id" value={r.id} />
                <FormMessage />
                <select name="status" defaultValue={r.commission_status} aria-label="Commission status" className="field-input">
                  {(Object.keys(COMMISSION_STATUS_LABELS) as CommissionStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {COMMISSION_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <input
                  name="adminNote"
                  defaultValue={r.admin_note ?? ""}
                  placeholder="Note, e.g. invoice number"
                  aria-label="Admin note"
                  className="field-input"
                />
                <PendingButton className="btn btn-dark btn-sm" pendingText="Saving…">
                  Save
                </PendingButton>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
