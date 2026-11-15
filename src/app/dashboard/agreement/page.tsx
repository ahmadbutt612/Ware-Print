import type { Metadata } from "next";
import Link from "next/link";
import { signAgreement } from "@/actions/account";
import { DashHeader } from "@/components/dashboard/dash-header";
import { AgreementDocument } from "@/components/site/agreement-text";
import { ActionForm, FieldError, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { Notice } from "@/components/ui/notice";
import { requireAccount } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { SellerAgreement } from "@/lib/types";

export const metadata: Metadata = { title: "Seller oath" };

export default async function AgreementPage() {
  const { profile, company, onboarding } = await requireAccount("/dashboard/agreement");
  const supabase = await createClient();
  const { data } = await supabase
    .from("seller_agreements")
    .select("id, version, signed_name, signed_at, ip_address")
    .order("signed_at", { ascending: false })
    .limit(5);
  const history = (data ?? []) as Pick<SellerAgreement, "id" | "version" | "signed_name" | "signed_at" | "ip_address">[];

  return (
    <div className="space-y-6">
      <DashHeader
        eyebrow="Required before listing"
        title="Seller oath & 2% commission"
        description="Read the declaration below. Type your full name to sign it. You only sign once (again only if Ware Print changes the terms)."
      />

      {onboarding.agreementSigned && history[0] && (
        <Notice tone="ok" title="You have signed the current version">
          Signed by {history[0].signed_name} on {formatDateTime(history[0].signed_at)}.
        </Notice>
      )}
      {!onboarding.companyComplete && (
        <Notice tone="warn" title="Add your company details first">
          The agreement is made in your company&apos;s name.{" "}
          <Link href="/dashboard/company" className="link">
            Add company details
          </Link>
        </Notice>
      )}

      <div className="max-w-3xl py-3">
        <AgreementDocument name={profile.full_name} company={company.name} />
      </div>

      {!onboarding.agreementSigned && onboarding.companyComplete && (
        <ActionForm action={signAgreement} className="max-w-3xl space-y-5 border border-line bg-paper-2 p-5 sm:p-6">
          <h2 className="font-cond text-xl font-bold">Sign</h2>
          <FormMessage />
          <FormField name="signedName" label="Type your full name" hint={`Exactly as on your account: ${profile.full_name}`}>
            <input id="signedName" name="signedName" autoComplete="off" className="field-input max-w-md font-medium" />
          </FormField>
          <div>
            <label className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" name="accept" className="mt-0.5" />
              <span>
                I have read this declaration and I agree to it on behalf of <strong>{company.name}</strong>, including the
                2% commission on sales to buyers introduced by Ware Print.
              </span>
            </label>
            <FieldError name="accept" />
          </div>
          <PendingButton pendingText="Signing…">Sign the seller oath</PendingButton>
          <p className="text-xs text-ink-3">We record your name, the date and time, and your IP address with your signature.</p>
        </ActionForm>
      )}

      {history.length > 0 && (
        <section className="max-w-3xl">
          <h2 className="font-semibold">Signature record</h2>
          <table className="spec-table mt-2 border border-line">
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <th scope="row">Version {h.version}</th>
                  <td>
                    {h.signed_name} · {formatDateTime(h.signed_at)}
                    {h.ip_address ? ` · IP ${h.ip_address}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
