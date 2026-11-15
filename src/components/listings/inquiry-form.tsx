"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { sendInquiry, type InquiryResult } from "@/actions/inquiries";
import { Field } from "@/components/ui/field";
import { IconCheck } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { INQUIRY_TOPICS } from "@/lib/format";
import { COUNTRIES, PAKISTAN_CITIES } from "@/lib/site";

export function InquiryForm({ listingId, refLabel, sellerName }: { listingId: string; refLabel: string; sellerName: string }) {
  const [state, action, pending] = useActionState(sendInquiry, { ok: false } as InquiryResult);
  const [round, setRound] = useState(0);
  const errors = state.fieldErrors ?? {};

  if (state.ok && round === 0) {
    return (
      <div className="border border-ok/40 bg-ok-tint p-5">
        <p className="flex items-center gap-2 font-semibold text-ok">
          <IconCheck size={18} strokeWidth={2} /> Inquiry sent to {state.sellerName ?? sellerName}
        </p>
        <p className="mt-2 text-sm text-ink-2">
          The seller has your question and contact details and will reply to you directly
          {state.email ? ` at ${state.email}` : ""}. We also emailed you a copy. Quote reference{" "}
          <span className="font-mono font-medium text-ink">{state.ref ?? refLabel}</span> when you speak to them.
        </p>
        <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => setRound(1)}>
          Ask another question
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      action={action}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setRound(0);
        startTransition(() => action(data));
      }}
      className="space-y-5"
    >
      <input type="hidden" name="listingId" value={listingId} />
      <div aria-hidden="true" className="hidden">
        <label>
          Leave this empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.message && !state.ok && <Notice tone="error">{state.message}</Notice>}

      <fieldset>
        <legend className="field-label">What would you like to know?</legend>
        <div className="flex flex-wrap gap-2">
          {INQUIRY_TOPICS.map((t) => (
            <label
              key={t.id}
              className="inline-flex cursor-pointer items-center gap-2 border border-line-strong px-3 py-2 text-sm select-none has-[:checked]:border-ink has-[:checked]:bg-paper-2 has-[:checked]:font-medium"
            >
              <input type="checkbox" name="topics" value={t.id} />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Your message" htmlFor="inq-message" error={errors.message}>
        <textarea
          id="inq-message"
          name="message"
          rows={4}
          maxLength={3000}
          className="field-input"
          placeholder={`Hello, I am interested in ${refLabel}. Please share…`}
          aria-invalid={Boolean(errors.message)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="inq-name" required error={errors.name}>
          <input id="inq-name" name="name" autoComplete="name" className="field-input" aria-invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Company" htmlFor="inq-company" optional error={errors.company}>
          <input id="inq-company" name="company" autoComplete="organization" className="field-input" />
        </Field>
        <Field label="Email" htmlFor="inq-email" required error={errors.email}>
          <input
            id="inq-email"
            name="email"
            type="email"
            autoComplete="email"
            className="field-input"
            aria-invalid={Boolean(errors.email)}
          />
        </Field>
        <Field label="Phone / WhatsApp" htmlFor="inq-phone" required error={errors.phone} hint="e.g. 0300 1234567">
          <input
            id="inq-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="field-input"
            aria-invalid={Boolean(errors.phone)}
          />
        </Field>
        <Field label="City" htmlFor="inq-city" optional>
          <input id="inq-city" name="city" list="inq-cities" autoComplete="address-level2" className="field-input" />
          <datalist id="inq-cities">
            {PAKISTAN_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Country" htmlFor="inq-country" optional>
          <input
            id="inq-country"
            name="country"
            list="inq-countries"
            defaultValue="Pakistan"
            autoComplete="country-name"
            className="field-input"
          />
          <datalist id="inq-countries">
            {COUNTRIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg">
          {pending ? "Sending…" : "Send inquiry to seller"}
        </button>
        <p className="text-xs text-ink-3">
          Your details are shared with this seller only. See our{" "}
          <Link href="/privacy" className="link">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
