import type { Metadata } from "next";
import { sendPhoneCode, verifyPhoneCode } from "@/actions/account";
import { DashHeader } from "@/components/dashboard/dash-header";
import { ActionForm, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { Notice } from "@/components/ui/notice";
import { requireAccount } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { formatPhone, maskPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Phone number" };

export default async function PhonePage() {
  const { profile, user } = await requireAccount("/dashboard/phone");
  const verified = Boolean(profile.phone && profile.phone_verified_at);

  const { data: activeCode } = await createAdminClient()
    .from("phone_otps")
    .select("phone, expires_at")
    .eq("user_id", user.id)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <DashHeader
        eyebrow="Verification"
        title="Mobile number"
        description="Ware Print verifies every seller's mobile number. Buyer inquiry alerts are sent to it by SMS. Buyers never see it unless you reply to them."
      />

      {verified && (
        <Notice tone="ok" title={`Verified: ${formatPhone(profile.phone)}`}>
          Verified on {formatDate(profile.phone_verified_at)}. To use a different number, verify the new one below.
        </Notice>
      )}

      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <section className="border border-line p-5">
          <p className="font-mono text-xs font-medium text-red">STEP 1</p>
          <h2 className="mt-1 font-semibold">{verified ? "Change number" : "Send a code"}</h2>
          <ActionForm action={sendPhoneCode} className="mt-4 space-y-4">
            <FormMessage />
            <FormField name="phone" label="Mobile number" hint="Pakistan: 0300 1234567. Other countries: start with + and the country code.">
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={activeCode?.phone ?? profile.phone_pending ?? ""}
                className="field-input"
              />
            </FormField>
            <PendingButton className="btn btn-dark" pendingText="Sending…">
              {activeCode ? "Send a new code" : "Send code by SMS"}
            </PendingButton>
          </ActionForm>
        </section>

        <section className={activeCode ? "border border-ink p-5" : "border border-line bg-paper-2 p-5"}>
          <p className="font-mono text-xs font-medium text-red">STEP 2</p>
          <h2 className="mt-1 font-semibold">Enter the code</h2>
          {activeCode ? (
            <ActionForm action={verifyPhoneCode} className="mt-4 space-y-4">
              <p className="text-sm text-ink-2">
                We sent a 6-digit code to <strong className="text-ink">{maskPhone(activeCode.phone)}</strong>. It expires in
                10 minutes.
              </p>
              <FormMessage />
              <FormField name="code" label="6-digit code">
                <input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={7}
                  className="field-input w-40 text-center font-mono text-lg tracking-[0.3em]"
                />
              </FormField>
              <PendingButton pendingText="Checking…">Verify number</PendingButton>
            </ActionForm>
          ) : (
            <p className="mt-3 text-sm text-ink-3">Send a code first. It arrives by SMS within a minute.</p>
          )}
        </section>
      </div>

      <p className="max-w-3xl text-sm text-ink-3">
        No SMS after a few minutes? Check the number and send a new code. If it still does not arrive, contact Ware
        Print — the team can verify your number with a phone call.
      </p>
    </div>
  );
}
