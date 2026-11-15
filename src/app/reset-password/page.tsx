import type { Metadata } from "next";
import Link from "next/link";
import { updatePassword } from "@/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { ActionForm, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { Notice } from "@/components/ui/notice";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  const user = await getUser();

  return (
    <AuthShell title="Choose a new password">
      {user ? (
        <ActionForm action={updatePassword} className="space-y-4">
          <p className="text-sm text-ink-2">
            Changing the password for <strong className="text-ink">{user.email}</strong>.
          </p>
          <FormMessage />
          <FormField name="password" label="New password" hint="At least 8 characters.">
            <input id="password" name="password" type="password" autoComplete="new-password" className="field-input" />
          </FormField>
          <FormField name="confirm" label="Repeat new password">
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="field-input" />
          </FormField>
          <PendingButton pendingText="Saving…">Save new password</PendingButton>
        </ActionForm>
      ) : (
        <Notice tone="warn" title="Open the link from your email first">
          This page works after you click the reset link we emailed you.{" "}
          <Link href="/forgot-password" className="link">
            Request a new link
          </Link>
          .
        </Notice>
      )}
    </AuthShell>
  );
}
