import type { Metadata } from "next";
import Link from "next/link";
import { setInquiryStatus } from "@/actions/inquiries";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ActionForm, PendingButton } from "@/components/ui/action-form";
import { IconMail, IconPhone } from "@/components/ui/icons";
import { Tag } from "@/components/ui/status";
import { requireAccount } from "@/lib/auth";
import { formatDateTime, INQUIRY_STATUS_LABELS, INQUIRY_TOPICS, listingPath, listingRef } from "@/lib/format";
import { formatPhone, whatsappLink } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import type { Inquiry, InquiryStatus } from "@/lib/types";
import { cn, firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Inquiries" };

type Row = Inquiry & { listings: { ref: number; slug: string; title: string } | null };

const statusTone: Record<InquiryStatus, string> = {
  new: "border-red bg-red text-white",
  replied: "border-ok/40 bg-ok-tint text-ok",
  closed: "border-line bg-paper-2 text-ink-3",
};

export default async function InquiriesPage({ searchParams }: PageProps<"/dashboard/inquiries">) {
  await requireAccount("/dashboard/inquiries");
  const sp = await searchParams;
  const filter = (["new", "replied", "closed"] as const).find((s) => s === firstParam(sp.status));

  const supabase = await createClient();
  const { data } = await supabase
    .from("inquiries")
    .select("*, listings(ref, slug, title)")
    .order("created_at", { ascending: false })
    .limit(300);
  const all = (data ?? []) as Row[];
  const rows = filter ? all.filter((q) => q.status === filter) : all;
  const topicLabel = new Map(INQUIRY_TOPICS.map((t) => [t.id, t.label]));

  return (
    <div className="space-y-6">
      <DashHeader
        eyebrow="Buyers"
        title="Inquiries"
        description="Questions from buyers about your machines. Reply to them directly by email, phone or WhatsApp. Each one is recorded as a buyer introduced by Ware Print."
      />

      <nav aria-label="Filter inquiries" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line">
        {[
          ["", "All", all.length],
          ["new", "New", all.filter((q) => q.status === "new").length],
          ["replied", "Replied", all.filter((q) => q.status === "replied").length],
          ["closed", "Closed", all.filter((q) => q.status === "closed").length],
        ].map(([key, label, n]) => (
          <Link
            key={key}
            href={key ? `/dashboard/inquiries?status=${key}` : "/dashboard/inquiries"}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm",
              (filter ?? "") === key ? "border-red font-semibold text-ink" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {label} <span className="tnum text-ink-3">{n}</span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="border border-line bg-paper-2 p-8 text-center text-sm text-ink-2">
          {all.length === 0
            ? "No inquiries yet. When a buyer asks about one of your machines, it appears here and we email and text you."
            : "Nothing in this list."}
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((q) => {
            const ref = q.listings ? listingRef(q.listings.ref) : "";
            const subject = `Re: ${ref} ${q.listings?.title ?? "your inquiry on Ware Print"}`;
            return (
              <li key={q.id} className={cn("border bg-paper", q.status === "new" ? "border-ink" : "border-line")}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {q.buyer_name}
                      {q.buyer_company && <span className="font-normal text-ink-2"> · {q.buyer_company}</span>}
                    </p>
                    <p className="text-xs text-ink-3">
                      {formatDateTime(q.created_at)}
                      {[q.buyer_city, q.buyer_country].filter(Boolean).length > 0 &&
                        ` · ${[q.buyer_city, q.buyer_country].filter(Boolean).join(", ")}`}
                    </p>
                  </div>
                  <span className={cn("border px-1.5 text-xs leading-5 font-semibold", statusTone[q.status])}>
                    {INQUIRY_STATUS_LABELS[q.status]}
                  </span>
                </div>
                <div className="space-y-3 px-4 py-3">
                  {q.listings && (
                    <p className="text-sm">
                      <span className="text-ink-3">About </span>
                      <Link href={listingPath(q.listings.ref, q.listings.slug)} className="link font-medium" target="_blank">
                        <span className="font-mono">{ref}</span> — {q.listings.title}
                      </Link>
                    </p>
                  )}
                  {q.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {q.topics.map((t) => (
                        <Tag key={t}>{topicLabel.get(t) ?? t}</Tag>
                      ))}
                    </div>
                  )}
                  <p className="text-[15px] whitespace-pre-line text-ink">{q.message}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-line bg-paper-2 px-4 py-3">
                  <a href={`mailto:${q.buyer_email}?subject=${encodeURIComponent(subject)}`} className="btn btn-outline btn-sm">
                    <IconMail size={14} /> {q.buyer_email}
                  </a>
                  <a href={`tel:${q.buyer_phone}`} className="btn btn-outline btn-sm">
                    <IconPhone size={14} /> {formatPhone(q.buyer_phone)}
                  </a>
                  <a
                    href={whatsappLink(q.buyer_phone, `Hello ${q.buyer_name}, about your inquiry for ${ref} on Ware Print: `)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    WhatsApp
                  </a>
                  <ActionForm action={setInquiryStatus} className="ml-auto flex gap-2">
                    <input type="hidden" name="id" value={q.id} />
                    {q.status !== "replied" && (
                      <PendingButton name="status" value="replied" className="btn btn-dark btn-sm" pendingText="…">
                        Mark replied
                      </PendingButton>
                    )}
                    {q.status !== "closed" && (
                      <PendingButton name="status" value="closed" className="btn btn-outline btn-sm" pendingText="…">
                        Close
                      </PendingButton>
                    )}
                    {q.status === "closed" && (
                      <PendingButton name="status" value="new" className="btn btn-outline btn-sm" pendingText="…">
                        Reopen
                      </PendingButton>
                    )}
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
