import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/actions/auth";
import { AuthShell } from "@/components/site/auth-shell";
import { ActionForm, FormField, FormMessage, PendingButton } from "@/components/ui/action-form";
import { Notice } from "@/components/ui/notice";
import { getUser } from "@/lib/auth";
import { firstParam, safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNextPath(firstParam(sp.next), "/dashboard");
  if (await getUser()) redirect(next);
  const error = firstParam(sp.error);

  return (
    <AuthShell title="Sign in" intro="For sellers and the Ware Print team. Buyers can send inquiries without an account.">
      {error === "link" && (
        <Notice tone="warn" className="mb-5" title="That link has expired or was already used">
          If you have already confirmed your email, just sign in below. Otherwise ask for a{" "}
          <Link href="/check-email" className="link">
            new confirmation link
          </Link>
          .
        </Notice>
      )}
      {error === "reset-link" && (
        <Notice tone="warn" className="mb-5" title="That password reset link has expired">
          <Link href="/forgot-password" className="link">
            Request a new reset link
          </Link>
          .
        </Notice>
      )}
      <ActionForm action={signIn} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <FormMessage />
        <FormField name="email" label="Email">
          <input id="email" name="email" type="email" autoComplete="email" required className="field-input" />
        </FormField>
        <FormField name="password" label="Password">
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field-input" />
        </FormField>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <PendingButton pendingText="Signing in…">Sign in</PendingButton>
          <Link href="/forgot-password" className="link text-sm">
            Forgot password?
          </Link>
        </div>
      </ActionForm>
      <p className="mt-6 border-t border-line pt-5 text-sm text-ink-2">
        New seller?{" "}
        <Link href="/signup" className="link font-medium text-ink">
          Create a seller account
        </Link>
      </p>
    </AuthShell>
  );
}
