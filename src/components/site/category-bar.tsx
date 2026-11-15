"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getCategory, NAV_CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

const item =
  "relative flex h-10 shrink-0 items-center px-3 text-[13px] font-medium whitespace-nowrap text-ink-2 hover:text-ink";
const active = "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:bg-red";

export function CategoryBar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const onBrowse = pathname === "/machines";
  const category = onBrowse ? params.get("category") : null;
  const kind = onBrowse ? params.get("kind") : null;
  return <CategoryLinks activeCategory={category} activeKind={kind} onBrowse={onBrowse} />;
}

export function CategoryLinks({
  activeCategory = null,
  activeKind = null,
  onBrowse = false,
}: {
  activeCategory?: string | null;
  activeKind?: string | null;
  onBrowse?: boolean;
}) {
  return (
    <div className="wrap scrollbar-none flex overflow-x-auto">
      <Link href="/machines" className={cn(item, "-ml-3", onBrowse && !activeCategory && !activeKind && active)}>
        All machines
      </Link>
      {NAV_CATEGORIES.map((slug) => (
        <Link
          key={slug}
          href={`/machines?category=${slug}`}
          className={cn(item, activeCategory === slug && active)}
        >
          {getCategory(slug)?.short}
        </Link>
      ))}
      <Link href="/machines?kind=setup" className={cn(item, "font-semibold text-red hover:text-red-dark", activeKind === "setup" && active)}>
        Complete setups
      </Link>
      <Link href="/categories" className={cn(item, "text-ink-3")}>
        All categories →
      </Link>
    </div>
  );
}
