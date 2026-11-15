"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconMenu, IconX } from "@/components/ui/icons";

export function MobileMenu({ signedIn, isAdmin }: { signedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the menu after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links: [string, string][] = [
    ["/machines", "Browse all machines"],
    ["/machines?kind=setup", "Complete setups"],
    ["/categories", "All categories"],
    ["/sell", "How selling works"],
    ...(signedIn
      ? ([
          ["/dashboard", "My account"],
          ["/dashboard/listings/new", "List a machine"],
        ] as [string, string][])
      : ([
          ["/login", "Sign in"],
          ["/signup", "Create seller account"],
        ] as [string, string][])),
    ...(isAdmin ? ([["/admin", "Admin"]] as [string, string][]) : []),
    ["/about", "About Ware Print"],
    ["/contact", "Contact"],
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <IconX /> : <IconMenu />}
        Menu
      </button>
      {open && (
        <nav id="mobile-menu" className="absolute inset-x-0 top-full z-40 border-y border-line bg-paper">
          <ul className="wrap divide-y divide-line">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="flex h-12 items-center text-[15px] font-medium">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
