import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { markSold } from "@/actions/listings";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ActionForm, FieldError, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { Notice } from "@/components/ui/notice";
import { requireAccount } from "@/lib/auth";
import { listingRef } from "@/lib/format";
import { CURRENCIES } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

export const metadata: Metadata = { title: "Mark as sold" };

export default async function MarkSoldPage({ params }: PageProps<"/dashboard/listings/[id]/sold">) {
  const { id } = await params;
  const account = await requireAccount(`/dashboard/listings/${id}/sold`);
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("id, ref, title, status, price_amount, price_currency")
    .eq("id", id)
    .eq("seller_id", account.user.id)
    .maybeSingle();
  if (!data) notFound();
  const listing = data as Pick<Listing, "id" | "ref" | "title" | "status" | "price_amount" | "price_currency">;

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("buyer_name, buyer_company")
    .eq("listing_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  const buyers = [...new Set((inquiries ?? []).map((q) => [q.buyer_name, q.buyer_company].filter(Boolean).join(", ")))];

  return (
    <div className="space-y-6">
      <DashHeader
        eyebrow={listingRef(listing.ref)}
        title="Mark as sold"
        description={listing.title}
        actions={
          <Link href={`/dashboard/listings/${id}`} className="btn btn-outline btn-sm">
            Back
          </Link>
        }
      />
      {listing.status !== "published" ? (
        <Notice tone="warn">Only published listings can be marked as sold.</Notice>
      ) : (
        <ActionForm action={markSold} className="max-w-2xl space-y-6">
          <input type="hidden" name="id" value={id} />
          <FormMessage />
          <fieldset>
            <legend className="field-label">Who bought the machine?</legend>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 border border-line-strong p-3.5 has-[:checked]:border-ink has-[:checked]:bg-paper-2">
                <input type="radio" name="via" value="wareprint" className="mt-0.5" />
                <span>
                  <span className="block font-semibold">A buyer introduced by Ware Print</span>
                  <span className="block text-[13px] text-ink-3">
                    They sent an inquiry on Ware Print, or found the machine through its Ware Print listing. The 2%
                    commission applies.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 border border-line-strong p-3.5 has-[:checked]:border-ink has-[:checked]:bg-paper-2">
                <input type="radio" name="via" value="elsewhere" className="mt-0.5" />
                <span>
                  <span className="block font-semibold">A buyer I found another way</span>
                  <span className="block text-[13px] text-ink-3">No commission. Ware Print may check this against inquiries.</span>
                </span>
              </label>
            </div>
            <FieldError name="via" />
          </fieldset>

          <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
            <FormField name="price" label="Final sale price" hint="Required if the buyer came through Ware Print.">
              <input
                id="price"
                name="price"
                inputMode="decimal"
                defaultValue={listing.price_amount ? String(Number(listing.price_amount)) : ""}
                className="field-input tnum"
              />
            </FormField>
            <FormField name="currency" label="Currency">
              <select id="currency" name="currency" defaultValue={listing.price_currency} className="field-input">
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField name="buyerName" label="Buyer name or company">
            <input id="buyerName" name="buyerName" list="inquiry-buyers" className="field-input" />
            <datalist id="inquiry-buyers">
              {buyers.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </FormField>
          <FormField name="notes" label="Notes" optional>
            <textarea id="notes" name="notes" rows={3} maxLength={1000} className="field-input" />
          </FormField>

          <div className="border-t border-line pt-5">
            <PendingButton pendingText="Saving…" confirm="Mark this listing as sold? It cannot be undone.">
              Mark as sold
            </PendingButton>
          </div>
        </ActionForm>
      )}
    </div>
  );
}
