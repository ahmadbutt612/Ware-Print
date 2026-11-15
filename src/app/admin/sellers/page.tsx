import type { Metadata } from "next";
import Link from "next/link";
import { DashHeader } from "@/components/dashboard/dash-header";
import { requireAdmin } from "@/lib/auth";
import { AGREEMENT_VERSION } from "@/lib/agreement";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Company, Profile } from "@/lib/types";
import { cn, firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Sellers" };

const FILTERS = [
  { key: "", label: "All" },
  { key: "unverified", label: "Phone not verified" },
  { key: "unsigned", label: "Oath not signed" },
  { key: "suspended", label: "Suspended" },
];

export default async function AdminSellersPage({ searchParams }: PageProps<"/admin/sellers">) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = firstParam(sp.filter);
  const q = firstParam(sp.q).trim().toLowerCase();

  const admin = createAdminClient();
  const [{ data: profiles }, { data: companies }, { data: listings }] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(2000),
    admin.from("companies").select("*").limit(2000),
    admin.from("listings").select("seller_id, status").limit(20000),
  ]);
  const companyById = new Map(((companies ?? []) as Company[]).map((c) => [c.id, c]));
  const live = new Map<string, number>();
  const total = new Map<string, number>();
  for (const l of (listings ?? []) as { seller_id: string; status: string }[]) {
    total.set(l.seller_id, (total.get(l.seller_id) ?? 0) + 1);
    if (l.status === "published") live.set(l.seller_id, (live.get(l.seller_id) ?? 0) + 1);
  }

  let rows = ((profiles ?? []) as Profile[]).map((p) => ({ p, c: companyById.get(p.id) }));
  if (filter === "unverified") rows = rows.filter((r) => !r.p.phone_verified_at);
  if (filter === "unsigned") rows = rows.filter((r) => r.p.agreement_version !== AGREEMENT_VERSION);
  if (filter === "suspended") rows = rows.filter((r) => r.c?.is_suspended);
  if (q) {
    rows = rows.filter((r) =>
      [r.c?.name, r.p.full_name, r.p.email, r.p.phone, r.c?.city].some((v) => v?.toLowerCase().includes(q)),
    );
  }

  return (
    <div className="space-y-6">
      <DashHeader eyebrow="Admin" title="Sellers" description="Everyone with an account. Open a seller to verify their phone by call, suspend them, or see their oath." />

      <form className="flex max-w-md" action="/admin/sellers">
        {filter && <input type="hidden" name="filter" value={filter} />}
        <input name="q" defaultValue={q} placeholder="Search company, name, email, phone, city" aria-label="Search sellers" className="field-input rounded-r-none border-r-0" />
        <button className="btn btn-dark rounded-l-none">Search</button>
      </form>

      <nav aria-label="Filter sellers" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/admin/sellers?filter=${f.key}` : "/admin/sellers"}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap",
              filter === f.key ? "border-red font-semibold text-ink" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-paper-2 text-left text-[13px] text-ink-2">
            <tr className="border-b border-line">
              <th className="px-3 py-2 font-medium">Company</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">Oath</th>
              <th className="px-3 py-2 font-medium">Listings</th>
              <th className="px-3 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-ink-3">
                  No sellers found.
                </td>
              </tr>
            )}
            {rows.map(({ p, c }) => (
              <tr key={p.id} className="hover:bg-paper-2">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/sellers/${p.id}`} className="font-medium hover:underline">
                    {c?.name || "(no company name)"}
                  </Link>
                  <span className="block text-xs text-ink-3">
                    {p.full_name}
                    {c?.city ? ` · ${c.city}` : ""}
                    {p.role === "admin" ? " · admin" : ""}
                    {c?.is_suspended ? " · SUSPENDED" : ""}
                  </span>
                </td>
                <td className="px-3 py-2.5 break-all">
                  {p.email}
                  {!p.email_confirmed_at && <span className="block text-xs text-warn">not confirmed</span>}
                </td>
                <td className="px-3 py-2.5">
                  {p.phone ? (
                    <span className="text-ok">{formatPhone(p.phone)} ✓</span>
                  ) : (
                    <span className="text-warn">{p.phone_pending ? `${p.phone_pending} — not verified` : "—"}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {p.agreement_version === AGREEMENT_VERSION ? (
                    <span className="text-ok">{formatDate(p.agreement_signed_at)}</span>
                  ) : (
                    <span className="text-ink-3">Not signed</span>
                  )}
                </td>
                <td className="tnum px-3 py-2.5">
                  {live.get(p.id) ?? 0} live / {total.get(p.id) ?? 0}
                </td>
                <td className="px-3 py-2.5 text-ink-2">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
