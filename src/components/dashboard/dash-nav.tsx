"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  badge?: number;
  exact?: boolean;
}

export function SideNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="scrollbar-none -mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 border-b border-line lg:flex-col lg:gap-0 lg:border-b-0 lg:border-l">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center justify-between gap-3 px-3 py-2.5 text-sm whitespace-nowrap lg:-ml-px lg:border-l-2 lg:py-2",
                  active
                    ? "font-semibold text-ink after:absolute after:inset-x-3 after:-bottom-px after:h-[2px] after:bg-red lg:border-red lg:after:hidden"
                    : "text-ink-2 hover:text-ink lg:border-transparent",
                )}
              >
                {item.label}
                {item.badge ? (
                  <span className="tnum min-w-5 bg-red px-1.5 text-center text-xs leading-5 font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
