import type { Metadata } from "next";
import { SideNav } from "@/components/dashboard/dash-nav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin | Ware Print" },
  robots: { index: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ count: pending }, { count: due }] = await Promise.all([
    admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("sales").select("id", { count: "exact", head: true }).eq("commission_status", "due"),
  ]);

  return (
    <div className="wrap py-6 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0">
          <div className="mb-4 hidden lg:block">
            <p className="eyebrow text-red">Ware Print team</p>
            <p className="mt-1 font-semibold">Admin</p>
          </div>
          <SideNav
            label="Admin"
            items={[
              { href: "/admin", label: "Overview", exact: true },
              { href: "/admin/listings", label: "Listings to review", badge: pending ?? 0 },
              { href: "/admin/sellers", label: "Sellers" },
              { href: "/admin/inquiries", label: "Inquiries" },
              { href: "/admin/sales", label: "Sales & commission", badge: due ?? 0 },
            ]}
          />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
