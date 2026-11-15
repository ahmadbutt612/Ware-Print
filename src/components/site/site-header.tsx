import Link from "next/link";
import { Suspense } from "react";
import { CategoryBar, CategoryLinks } from "@/components/site/category-bar";
import { HeaderSearch, SearchForm } from "@/components/site/header-search";
import { Logo } from "@/components/site/logo";
import { MobileMenu } from "@/components/site/mobile-menu";
import { getAccount } from "@/lib/auth";

export async function SiteHeader() {
  const account = await getAccount();
  const signedIn = Boolean(account);
  const isAdmin = Boolean(account?.isAdmin);

  return (
    <header className="relative border-b border-line bg-paper">
      <div className="hidden border-b border-line bg-paper-2 md:block">
        <div className="wrap flex h-8 items-center justify-between text-xs text-ink-2">
          <p>Printing &amp; packaging machinery marketplace · Pakistan</p>
          <nav className="flex items-center gap-5" aria-label="Site">
            <Link href="/sell" className="hover:text-ink">
              How selling works
            </Link>
            <Link href="/about" className="hover:text-ink">
              About Ware Print
            </Link>
            <Link href="/contact" className="hover:text-ink">
              Contact
            </Link>
          </nav>
        </div>
      </div>

      <div className="wrap flex h-16 items-center gap-4 lg:gap-8">
        <Logo />
        <div className="hidden min-w-0 flex-1 md:flex">
          <Suspense fallback={<SearchForm />}>
            <HeaderSearch />
          </Suspense>
        </div>
        <nav className="ml-auto hidden items-center gap-2 md:flex" aria-label="Account">
          {isAdmin && (
            <Link href="/admin" className="btn btn-outline btn-sm">
              Admin
            </Link>
          )}
          {signedIn ? (
            <Link href="/dashboard" className="btn btn-outline btn-sm">
              My account
            </Link>
          ) : (
            <Link href="/login" className="btn btn-outline btn-sm">
              Sign in
            </Link>
          )}
          <Link href={signedIn ? "/dashboard/listings/new" : "/sell"} className="btn btn-primary btn-sm">
            Sell a machine
          </Link>
        </nav>
        <div className="ml-auto md:hidden">
          <MobileMenu signedIn={signedIn} isAdmin={isAdmin} />
        </div>
      </div>

      <div className="border-t border-line px-4 py-3 md:hidden">
        <Suspense fallback={<SearchForm />}>
          <HeaderSearch />
        </Suspense>
      </div>

      <nav aria-label="Machine categories" className="border-t border-line">
        <Suspense fallback={<CategoryLinks />}>
          <CategoryBar />
        </Suspense>
      </nav>
    </header>
  );
}
