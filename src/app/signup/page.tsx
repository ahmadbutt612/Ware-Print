import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signUp } from "@/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { ActionForm, FieldError, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create a seller account",
  description: "Sell printing and packaging machinery on Ware Print. Free to list, 2% commission only when it sells.",
};

export default async function SignUpPage() {
  if (await getUser()) redirect("/dashboard");

  return (
    <AuthShell
      title="Create a seller account"
      intro="You will confirm your email address next, then verify your mobile number before listing."
    >
      <ActionForm action={signUp} className="space-y-4">
        <FormMessage />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="fullName" label="Your full name" required>
            <input id="fullName" name="fullName" autoComplete="name" className="field-input" />
          </FormField>
          <FormField name="companyName" label="Company name" required>
            <input id="companyName" name="companyName" autoComplete="organization" className="field-input" />
          </FormField>
        </div>
        <FormField name="email" label="Email" required hint="Your login, and where buyer inquiries are sent.">
          <input id="email" name="email" type="email" autoComplete="email" className="field-input" />
        </FormField>
        <FormField name="phone" label="Mobile number" required hint="We will text a code to verify it, e.g. 0300 1234567.">
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="field-input" />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="password" label="Password" required hint="At least 8 characters.">
            <input id="password" name="password" type="password" autoComplete="new-password" className="field-input" />
          </FormField>
          <FormField name="confirm" label="Repeat password" required>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="field-input" />
          </FormField>
        </div>
        <div>
          <label className="flex items-start gap-2.5 text-sm text-ink-2">
            <input type="checkbox" name="terms" className="mt-0.5" />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="link" target="_blank">
                terms of use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="link" target="_blank">
                privacy policy
              </Link>
              . Before listing, I will also sign the{" "}
              <Link href="/seller-agreement" className="link" target="_blank">
                seller oath &amp; 2% commission agreement
              </Link>
              .
            </span>
          </label>
          <FieldError name="terms" />
        </div>
        <PendingButton pendingText="Creating account…" className="btn btn-primary btn-lg w-full sm:w-auto">
          Create account
        </PendingButton>
      </ActionForm>
      <p className="mt-6 border-t border-line pt-5 text-sm text-ink-2">
        Already registered?{" "}
        <Link href="/login" className="link font-medium text-ink">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
