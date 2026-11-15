import type { Metadata } from "next";
import Link from "next/link";
import { resendConfirmation } from "@/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { ActionForm, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { IconMail } from "@/components/ui/icons";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

export default async function CheckEmailPage({ searchParams }: PageProps<"/check-email">) {
  const email = firstParam((await searchParams).email);

  return (
    <AuthShell
      title="Check your email"
      intro={
        email ? (
          <>
            We sent a confirmation link to <strong className="text-ink">{email}</strong>. Open it to activate your
            account.
          </>
        ) : (
          "We sent you a confirmation link. Open it to activate your account."
        )
      }
    >
      <div className="flex gap-4 border border-line bg-paper-2 p-4 text-sm text-ink-2">
        <IconMail size={22} className="shrink-0 text-red" />
        <ul className="list-disc space-y-1 pl-4">
          <li>The email comes from Ware Print and can take a few minutes.</li>
          <li>Check your spam or promotions folder if you cannot see it.</li>
          <li>The link works once. After confirming, you go straight to your seller dashboard.</li>
        </ul>
      </div>

      <h2 className="mt-8 font-semibold">Didn&apos;t get it?</h2>
      <ActionForm action={resendConfirmation} className="mt-3 space-y-3">
        <FormMessage />
        <FormField name="email" label="Email">
          <input id="email" name="email" type="email" defaultValue={email} autoComplete="email" className="field-input" />
        </FormField>
        <PendingButton className="btn btn-outline" pendingText="Sending…">
          Send a new link
        </PendingButton>
      </ActionForm>
      <p className="mt-6 border-t border-line pt-5 text-sm text-ink-2">
        Already confirmed?{" "}
        <Link href="/login" className="link font-medium text-ink">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
