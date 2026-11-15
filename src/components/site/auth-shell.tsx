import type { ReactNode } from "react";
import { IconCheck } from "@/components/ui/icons";

/** Two-column frame for sign-in / sign-up pages. */
export function AuthShell({
  title,
  intro,
  children,
  aside,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="wrap py-10 lg:py-16">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="border border-line bg-paper p-6 sm:p-8">
          <h1 className="font-cond text-[30px] leading-tight font-bold">{title}</h1>
          {intro && <div className="mt-2 text-ink-2">{intro}</div>}
          <div className="mt-6">{children}</div>
        </div>
        {aside ?? <SellerBenefits />}
      </div>
    </div>
  );
}

export function SellerBenefits() {
  const points = [
    "Free to list — no monthly fee",
    "2% commission only when you sell to a buyer from Ware Print",
    "Photos, videos and full specifications for every machine",
    "Sell single machines or complete setups",
    "Inquiries sent to your email and phone",
  ];
  return (
    <aside className="self-start border border-line bg-paper-2 p-6">
      <p className="eyebrow">Selling on Ware Print</p>
      <ul className="mt-4 space-y-3 text-sm">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5">
            <IconCheck size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-ok" />
            <span className="text-ink-2">{p}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-line pt-4 text-xs text-ink-3">
        Buyers do not need an account. They contact sellers from any listing.
      </p>
    </aside>
  );
}
