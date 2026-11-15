import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { ActionForm, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" intro="Enter your account email and we will send you a link to choose a new password.">
      <ActionForm action={requestPasswordReset} className="space-y-4">
        <FormMessage />
        <FormField name="email" label="Email">
          <input id="email" name="email" type="email" autoComplete="email" className="field-input" />
        </FormField>
        <PendingButton pendingText="Sending…">Send reset link</PendingButton>
      </ActionForm>
      <p className="mt-6 border-t border-line pt-5 text-sm text-ink-2">
        Remembered it?{" "}
        <Link href="/login" className="link font-medium text-ink">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
