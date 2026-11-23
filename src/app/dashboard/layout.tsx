import type { Metadata } from "next";
import { signOut } from "@/actions/auth";
import { SideNav } from "@/components/dashboard/dash-nav";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Seller dashboard", template: "%s | Seller dashboard | Ware Print" },
  robots: { index: false },
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const account = await requireAccount("/dashboard");
  const supabase = await createClient();
  const { count: newInquiries } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return (
    <div className="wrap py-6 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0">
          <div className="mb-4 hidden lg:block">
            <p className="eyebrow">Seller account</p>
            <p className="mt-1 leading-snug font-semibold break-words">{account.company.name || "Your company"}</p>
            <p className="mt-0.5 text-[13px] break-all text-ink-3">{account.user.email}</p>
          </div>
          <SideNav
            label="Seller dashboard"
            items={[
              { href: "/dashboard", label: "Overview", exact: true },
              { href: "/dashboard/listings", label: "My listings" },
              { href: "/dashboard/inquiries", label: "Inquiries", badge: newInquiries ?? 0 },
              { href: "/dashboard/company", label: "Company details" },
              { href: "/dashboard/phone", label: "Phone number" },
              { href: "/dashboard/agreement", label: "Seller oath" },
            ]}
          />
          <form action={signOut} className="mt-4 hidden lg:block">
            <SubmitButton className="inline-flex items-center gap-2 px-3 text-sm text-ink-3 hover:text-ink hover:underline" pendingText="Signing out…">
              Sign out
            </SubmitButton>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
      <form action={signOut} className="mt-10 border-t border-line pt-4 lg:hidden">
        <SubmitButton className="inline-flex items-center gap-2 text-sm text-ink-3 underline" pendingText="Signing out…">
          Sign out
        </SubmitButton>
      </form>
    </div>
  );
}
