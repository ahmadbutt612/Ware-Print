import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setSellerSuspended, verifySellerPhone } from "@/actions/admin";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ActionForm, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { ListingStatusBadge } from "@/components/ui/status";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime, listingRef } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Company, Listing, Profile, SellerAgreement } from "@/lib/types";

export const metadata: Metadata = { title: "Seller" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminSellerPage({ params }: PageProps<"/admin/sellers/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const admin = createAdminClient();
  const [{ data: profile }, { data: company }, { data: listings }, { data: agreements }, { count: inquiries }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).maybeSingle(),
    admin.from("companies").select("*").eq("id", id).maybeSingle(),
    admin.from("listings").select("id, ref, title, status, updated_at").eq("seller_id", id).order("updated_at", { ascending: false }),
    admin.from("seller_agreements").select("*").eq("seller_id", id).order("signed_at", { ascending: false }),
    admin.from("inquiries").select("id", { count: "exact", head: true }).eq("seller_id", id),
  ]);
  if (!profile || !company) notFound();
  const p = profile as Profile;
  const c = company as Company;

  return (
    <div className="space-y-8">
      <DashHeader
        eyebrow={c.is_suspended ? "Seller · SUSPENDED" : "Seller"}
        title={c.name || "(no company name)"}
        description={`${p.full_name || "No contact name"} · joined ${formatDate(p.created_at)}`}
        actions={
          <Link href={`/sellers/${id}`} className="btn btn-outline btn-sm" target="_blank">
            Public page
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-line p-5">
          <h2 className="font-semibold">Details</h2>
          <dl className="mt-3 grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-ink-3">Login email</dt>
            <dd className="break-all">
              {p.email} {p.email_confirmed_at ? "✓ confirmed" : "(not confirmed)"}
            </dd>
            <dt className="text-ink-3">Inquiry email</dt>
            <dd className="break-all">{p.contact_email || p.email}</dd>
            <dt className="text-ink-3">Phone</dt>
            <dd>
              {p.phone ? `${formatPhone(p.phone)} ✓ ${formatDate(p.phone_verified_at)}` : "Not verified"}
              {p.phone_pending && !p.phone && <span className="block text-ink-3">Entered: {p.phone_pending}</span>}
            </dd>
            <dt className="text-ink-3">City</dt>
            <dd>{[c.city, c.country].filter(Boolean).join(", ") || "—"}</dd>
            <dt className="text-ink-3">Address</dt>
            <dd>{p.address || "—"}</dd>
            <dt className="text-ink-3">Website</dt>
            <dd className="break-all">{c.website || "—"}</dd>
            <dt className="text-ink-3">Inquiries received</dt>
            <dd>{inquiries ?? 0}</dd>
          </dl>
          {c.about && <p className="mt-4 border-t border-line pt-3 text-sm whitespace-pre-line text-ink-2">{c.about}</p>}
        </section>

        <div className="space-y-6">
          <section className="border border-line p-5">
            <h2 className="font-semibold">Verify phone by call</h2>
            <p className="mt-1 text-sm text-ink-2">
              If the WhatsApp code does not arrive, call the seller on this number, confirm who they are, then mark it verified.
            </p>
            <ActionForm action={verifySellerPhone} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={id} />
              <FormMessage />
              <FormField name="phone" label="Mobile number">
                <input id="phone" name="phone" defaultValue={p.phone ?? p.phone_pending ?? ""} className="field-input" />
              </FormField>
              <PendingButton className="btn btn-dark btn-sm" pendingText="Saving…">
                Mark as verified
              </PendingButton>
            </ActionForm>
          </section>

          <section className="border border-line p-5">
            <h2 className="font-semibold">{c.is_suspended ? "Reactivate seller" : "Suspend seller"}</h2>
            <p className="mt-1 text-sm text-ink-2">
              {c.is_suspended
                ? "Their published listings become visible again and they can submit new ones."
                : "Hides all their listings from buyers and stops them submitting new ones."}
            </p>
            <ActionForm action={setSellerSuspended} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="suspend" value={c.is_suspended ? "false" : "true"} />
              <FormMessage />
              <PendingButton
                className={c.is_suspended ? "btn btn-dark btn-sm" : "btn btn-danger btn-sm"}
                pendingText="Saving…"
                confirm={c.is_suspended ? undefined : "Suspend this seller and hide all their listings?"}
              >
                {c.is_suspended ? "Reactivate" : "Suspend seller"}
              </PendingButton>
            </ActionForm>
          </section>
        </div>
      </div>

      <section>
        <h2 className="font-cond text-xl font-bold">Listings</h2>
        {(listings ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-ink-3">No listings.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border border-line">
            {((listings ?? []) as Pick<Listing, "id" | "ref" | "title" | "status" | "updated_at">[]).map((l) => (
              <li key={l.id}>
                <Link href={`/admin/listings/${l.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 hover:bg-paper-2">
                  <span className="w-20 font-mono text-xs text-ink-3">{listingRef(l.ref)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.title || "Untitled"}</span>
                  <ListingStatusBadge status={l.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-cond text-xl font-bold">Seller oath record</h2>
        {(agreements ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-ink-3">Not signed yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {((agreements ?? []) as SellerAgreement[]).map((a) => (
              <li key={a.id} className="border border-line p-4 text-sm">
                <p>
                  <strong>Version {a.version}</strong> — signed “{a.signed_name}” for {a.company_name}
                </p>
                <p className="text-ink-3">
                  {formatDateTime(a.signed_at)} · IP {a.ip_address ?? "unknown"}
                </p>
                <details className="mt-2">
                  <summary className="link text-sm">Show the signed text</summary>
                  <pre className="mt-2 overflow-x-auto bg-paper-2 p-3 font-mono text-xs whitespace-pre-wrap">{a.agreement_text}</pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
