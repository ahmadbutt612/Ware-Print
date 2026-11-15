"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { saveListing } from "@/actions/listings";
import { MachineFields, ManufacturerList } from "@/components/editor/machine-fields";
import { MediaManager } from "@/components/editor/media-manager";
import { Field } from "@/components/ui/field";
import { IconCheck, IconPlus } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { categorySingular } from "@/lib/categories";
import { formatMoney, lakhCrore } from "@/lib/format";
import {
  emptyItem,
  LIMITS,
  parseAmount,
  suggestTitle,
  validateForSubmit,
  type ItemDraft,
  type ListingDraft,
  type MediaDraft,
} from "@/lib/listing-input";
import { COUNTRIES, CURRENCIES, PAKISTAN_CITIES } from "@/lib/site";
import type { ListingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function pathsOf(media: MediaDraft[]): Set<string> {
  return new Set(media.flatMap((m) => [m.storagePath, m.thumbPath]).filter((p): p is string => Boolean(p)));
}

function Section({ n, title, description, children }: { n: number; title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="scroll-mt-4">
      <div className="flex items-baseline gap-3 border-b border-ink pb-2">
        <span className="font-mono text-xs font-medium text-red">{String(n).padStart(2, "0")}</span>
        <h2 className="font-cond text-xl font-bold">{title}</h2>
      </div>
      {description && <p className="mt-2 text-sm text-ink-2">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ChoiceCard({
  name,
  checked,
  onChange,
  title,
  hint,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border border-line-strong p-3.5 has-[:checked]:border-ink has-[:checked]:bg-paper-2">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-0.5" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block text-[13px] text-ink-3">{hint}</span>
      </span>
    </label>
  );
}

export function ListingEditor({
  initial,
  isNew,
  status,
  userId,
}: {
  initial: ListingDraft;
  isNew: boolean;
  status: ListingStatus;
  userId: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ListingDraft>(initial);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "warn"; text: string } | null>(null);
  const [saving, setSaving] = useState<null | "draft" | "submit">(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedPaths, setSavedPaths] = useState(() => pathsOf(initial.media));
  // Until the seller types their own title, it follows the machine details.
  const [titleTouched, setTitleTouched] = useState(Boolean(initial.title.trim()));

  const update = useCallback(
    (fn: (d: ListingDraft) => ListingDraft) => {
      setDraft((prev) => {
        const next = fn(prev);
        return titleTouched ? next : { ...next, title: suggestTitle(next, categorySingular) };
      });
      setDirty(true);
    },
    [titleTouched],
  );

  const setField = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) =>
    update((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const submitErrors = useMemo(() => validateForSubmit(draft), [draft]);
  const errors = attempted ? { ...serverErrors, ...submitErrors } : serverErrors;
  const missing = Object.keys(submitErrors).length;
  const isSetup = draft.kind === "setup";
  const published = status === "published";
  const pending = status === "pending";

  const errorKeys = Object.keys(submitErrors);
  const checks = [
    ...(isSetup ? [{ label: "At least two machines", ok: !submitErrors.items }] : []),
    { label: "Machine type, make and model", ok: !errorKeys.some((k) => /^items\.\d+\.(category|manufacturer|model|year)$/.test(k)) },
    { label: "Running status", ok: !errorKeys.some((k) => k.endsWith("runningStatus")) },
    { label: "At least one photo", ok: !submitErrors.media },
    { label: "Title", ok: !submitErrors.title },
    { label: "Price, or “on request”", ok: !submitErrors.priceAmount },
    { label: "Location", ok: !submitErrors.city && !submitErrors.country },
    { label: "Confirmation ticked", ok: !submitErrors.confirmAuthentic },
  ];

  function scrollToFirstError() {
    requestAnimationFrame(() => {
      document.querySelector('[data-field-error="true"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function save(intent: "draft" | "submit") {
    if (uploading) {
      setMessage({ tone: "warn", text: "Please wait for the uploads to finish, then save." });
      return;
    }
    if (intent === "submit") {
      setAttempted(true);
      if (missing > 0) {
        setMessage({
          tone: "error",
          text: `${missing} required ${missing === 1 ? "detail is" : "details are"} missing. They are marked in red.`,
        });
        scrollToFirstError();
        return;
      }
    }
    setSaving(intent);
    setMessage(null);
    try {
      const res = await saveListing(draft, intent);
      if (!res.ok) {
        setServerErrors(res.fieldErrors ?? {});
        setMessage({ tone: "error", text: res.message ?? "The listing could not be saved." });
        scrollToFirstError();
        return;
      }
      setServerErrors({});
      setDirty(false);
      setSavedPaths(pathsOf(draft.media));
      if (isNew || intent === "submit") {
        router.push(`/dashboard/listings/${draft.id}?saved=${intent}`);
      } else {
        setMessage({ tone: "ok", text: res.message ?? "Saved." });
        router.refresh();
      }
    } catch {
      setMessage({ tone: "error", text: "Could not reach the server. Check your internet connection and try again." });
    } finally {
      setSaving(null);
    }
  }

  function setKind(kind: ListingDraft["kind"]) {
    if (kind === draft.kind) return;
    if (
      kind === "single" &&
      draft.items.length > 1 &&
      !window.confirm("Keep only the first machine? The other machines will be removed from this listing.")
    ) {
      return;
    }
    update((d) => ({
      ...d,
      kind,
      items: kind === "single" ? d.items.slice(0, 1) : d.items.length < 2 ? [...d.items, emptyItem()] : d.items,
    }));
  }

  function setItem(i: number, item: ItemDraft) {
    update((d) => ({ ...d, items: d.items.map((it, k) => (k === i ? item : it)) }));
  }

  function moveItem(i: number, delta: number) {
    update((d) => {
      const items = [...d.items];
      const j = i + delta;
      if (j < 0 || j >= items.length) return d;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...d, items };
    });
  }

  const mediaUpdater = useCallback(
    (fn: (prev: MediaDraft[]) => MediaDraft[]) => update((d) => ({ ...d, media: fn(d.media) })),
    [update],
  );

  const amount = parseAmount(draft.priceAmount);
  const words = draft.priceCurrency === "PKR" ? lakhCrore(amount) : null;

  const primaryLabel = published ? "Submit changes for review" : pending ? "Save changes" : "Submit for review";
  const buttons = (
    <>
      {!published && !pending && (
        <button type="button" className="btn btn-outline" onClick={() => save("draft")} disabled={saving !== null}>
          {saving === "draft" ? "Saving…" : "Save draft"}
        </button>
      )}
      <button type="button" className="btn btn-primary" onClick={() => save("submit")} disabled={saving !== null}>
        {saving === "submit" ? "Saving…" : primaryLabel}
      </button>
    </>
  );

  return (
    <div className="grid gap-8 pb-24 xl:grid-cols-[minmax(0,1fr)_260px] xl:pb-0">
      <div className="min-w-0 space-y-12">
        {published && (
          <Notice tone="warn" title="This listing is live">
            Saving changes sends it back to Ware Print for review. It is hidden from buyers until approved again. To
            change only the price, use “Update price” on the right instead.
          </Notice>
        )}
        {message && <Notice tone={message.tone}>{message.text}</Notice>}

        <Section n={1} title="What are you selling?">
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              name="kind"
              checked={!isSetup}
              onChange={() => setKind("single")}
              title="A single machine"
              hint="One press, cutter, slitter or other machine."
            />
            <ChoiceCard
              name="kind"
              checked={isSetup}
              onChange={() => setKind("setup")}
              title="A complete setup"
              hint="Several machines sold together, e.g. flexo + die cutter + slitter."
            />
          </div>
        </Section>

        <Section
          n={2}
          title={isSetup ? "Machines in this setup" : "Machine details"}
          description={
            isSetup
              ? "Add each machine in the setup with its own model, year, running status and specifications."
              : "Model and running status are required. The more specifications you add, the fewer questions buyers need to ask."
          }
        >
          <div className={cn(isSetup && "space-y-4")} data-field-error={errors.items ? "true" : undefined}>
            {draft.items.map((item, i) => (
              <MachineFields
                key={i}
                index={i}
                item={item}
                isSetup={isSetup}
                count={draft.items.length}
                errors={errors}
                onChange={(next) => setItem(i, next)}
                onRemove={() => update((d) => ({ ...d, items: d.items.filter((_, k) => k !== i) }))}
                onMove={(delta) => moveItem(i, delta)}
              />
            ))}
            {errors.items && <p className="text-[13px] font-medium text-red">{errors.items}</p>}
            {isSetup && draft.items.length < LIMITS.items && (
              <button
                type="button"
                className="btn btn-secondary w-full border-dashed"
                onClick={() => update((d) => ({ ...d, items: [...d.items, emptyItem()] }))}
              >
                <IconPlus /> Add another machine
              </button>
            )}
          </div>
        </Section>

        <Section n={3} title="Photos & videos">
          <MediaManager
            userId={userId}
            listingId={draft.id}
            media={draft.media}
            onChange={mediaUpdater}
            savedPaths={savedPaths}
            onBusyChange={setUploading}
            error={errors.media}
          />
        </Section>

        <Section n={4} title="Title & description">
          <div className="space-y-5">
            <Field
              label="Listing title"
              htmlFor="title"
              required
              error={errors.title}
              hint={titleTouched ? undefined : "Filled in from the machine details. You can change it."}
            >
              <input
                id="title"
                value={draft.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setTitleTouched(true);
                  setDraft((d) => ({ ...d, title }));
                  setDirty(true);
                }}
                maxLength={LIMITS.title}
                placeholder="e.g. Heidelberg SM 74-4 (2006) — four colour offset press"
                className="field-input"
                aria-invalid={Boolean(errors.title)}
                data-field-error={errors.title ? "true" : undefined}
              />
            </Field>
            <Field
              label="Description"
              htmlFor="description"
              optional
              error={errors.description}
              hint="Why you are selling, service history, recent repairs, known faults, what the machine has been printing. Do not add phone numbers — buyers contact you through Ware Print."
            >
              <textarea
                id="description"
                value={draft.description}
                onChange={(e) => setField("description", e.target.value)}
                maxLength={LIMITS.description}
                rows={7}
                className="field-input"
              />
            </Field>
          </div>
        </Section>

        <Section n={5} title="Price" description="Showing a price is optional. Listings with a price usually get more serious inquiries.">
          <div className="grid gap-3 md:grid-cols-3">
            <ChoiceCard
              name="priceType"
              checked={draft.priceType === "on_request"}
              onChange={() => setField("priceType", "on_request")}
              title="Price on request"
              hint="Buyers ask you for the price."
            />
            <ChoiceCard
              name="priceType"
              checked={draft.priceType === "negotiable"}
              onChange={() => setField("priceType", "negotiable")}
              title="Negotiable price"
              hint="Show a price, open to offers."
            />
            <ChoiceCard
              name="priceType"
              checked={draft.priceType === "fixed"}
              onChange={() => setField("priceType", "fixed")}
              title="Fixed price"
              hint="Show a final price."
            />
          </div>
          {draft.priceType !== "on_request" && (
            <div className="mt-4 max-w-md">
              <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
                <Field label="Price" htmlFor="priceAmount" required error={errors.priceAmount}>
                  <input
                    id="priceAmount"
                    value={draft.priceAmount}
                    onChange={(e) => setField("priceAmount", e.target.value.replace(/[^\d.,]/g, ""))}
                    inputMode="decimal"
                    placeholder="e.g. 4500000"
                    className="field-input tnum"
                    aria-invalid={Boolean(errors.priceAmount)}
                    data-field-error={errors.priceAmount ? "true" : undefined}
                  />
                </Field>
                <Field label="Currency" htmlFor="priceCurrency">
                  <select
                    id="priceCurrency"
                    value={draft.priceCurrency}
                    onChange={(e) => setField("priceCurrency", e.target.value)}
                    className="field-input"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              {amount && (
                <p className="mt-2 text-sm text-ink-2">
                  Buyers will see <strong className="tnum text-ink">{formatMoney(amount, draft.priceCurrency)}</strong>
                  {words ? ` (${words})` : ""}
                  {draft.priceType === "negotiable" ? " · Negotiable" : ""}
                </p>
              )}
            </div>
          )}
        </Section>

        <Section n={6} title="Location & availability">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City where the machine is" htmlFor="city" required error={errors.city}>
              <input
                id="city"
                value={draft.city}
                onChange={(e) => setField("city", e.target.value)}
                list="editor-cities"
                maxLength={80}
                className="field-input"
                aria-invalid={Boolean(errors.city)}
                data-field-error={errors.city ? "true" : undefined}
              />
            </Field>
            <Field label="Country" htmlFor="country" required error={errors.country}>
              <input
                id="country"
                value={draft.country}
                onChange={(e) => setField("country", e.target.value)}
                list="editor-countries"
                maxLength={80}
                className="field-input"
                aria-invalid={Boolean(errors.country)}
                data-field-error={errors.country ? "true" : undefined}
              />
            </Field>
            <Field label="Availability" htmlFor="availability" optional className="sm:col-span-2">
              <input
                id="availability"
                value={draft.availability}
                onChange={(e) => setField("availability", e.target.value)}
                list="editor-availability"
                maxLength={LIMITS.text}
                placeholder="e.g. Available now"
                className="field-input"
              />
            </Field>
          </div>
          <div className="mt-4 space-y-2.5">
            <label className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={draft.inspectionAvailable}
                onChange={(e) => setField("inspectionAvailable", e.target.checked)}
                className="mt-0.5"
              />
              Buyers can inspect the machine at its location
            </label>
            <label className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={draft.loadingAssistance}
                onChange={(e) => setField("loadingAssistance", e.target.checked)}
                className="mt-0.5"
              />
              I can help with dismantling and loading
            </label>
          </div>
          <datalist id="editor-cities">
            {PAKISTAN_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="editor-countries">
            {COUNTRIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <datalist id="editor-availability">
            {["Available now", "Within 1 month", "Within 3 months", "After current orders are finished"].map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </Section>

        <Section n={7} title="Confirm">
          <label
            className={cn(
              "flex items-start gap-3 border p-4 text-sm",
              errors.confirmAuthentic ? "border-red bg-red-tint" : "border-line-strong",
            )}
            data-field-error={errors.confirmAuthentic ? "true" : undefined}
          >
            <input
              type="checkbox"
              checked={draft.confirmAuthentic}
              onChange={(e) => setField("confirmAuthentic", e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I confirm {isSetup ? "these machines exist" : "this machine exists"}, the photos show{" "}
              {isSetup ? "them" : "it"}, and I own {isSetup ? "them" : "it"} or have the owner&apos;s permission to sell. If{" "}
              {isSetup ? "the setup sells" : "it sells"} to a buyer introduced by Ware Print, I will pay the 2% commission in
              my seller oath.
            </span>
          </label>
          {errors.confirmAuthentic && <p className="mt-1.5 text-[13px] font-medium text-red">{errors.confirmAuthentic}</p>}
        </Section>

        <div className="hidden flex-wrap items-center gap-3 border-t border-line pt-6 xl:flex">{buttons}</div>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-4 space-y-4">
          <div className="border border-line">
            <p className="border-b border-line px-4 py-3 text-sm font-semibold">Ready to submit?</p>
            <ul className="space-y-2 px-4 py-3 text-[13px]">
              {checks.map((c) => (
                <li key={c.label} className={cn("flex items-start gap-2", c.ok ? "text-ink-2" : "text-ink")}>
                  <span
                    className={cn(
                      "mt-0.5 grid size-4 shrink-0 place-items-center border",
                      c.ok ? "border-ok bg-ok text-white" : "border-line-strong",
                    )}
                  >
                    {c.ok && <IconCheck size={10} strokeWidth={3} />}
                  </span>
                  {c.label}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 border-t border-line p-4">{buttons}</div>
          </div>
          <p className="text-xs text-ink-3">
            {dirty ? "You have unsaved changes." : "All changes saved."} After you submit, Ware Print checks the listing —
            usually within one working day — and emails you.
          </p>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-end gap-2 border-t border-line bg-paper px-4 py-3 xl:hidden">
        <p className="mr-auto hidden text-xs text-ink-3 sm:block">
          {missing ? `${missing} required ${missing === 1 ? "detail" : "details"} left` : "Ready to submit"}
        </p>
        {buttons}
      </div>
      <ManufacturerList />
    </div>
  );
}
