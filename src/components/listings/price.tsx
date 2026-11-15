import { formatMoney, lakhCrore } from "@/lib/format";
import type { PriceType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PriceProps {
  type: PriceType;
  amount: number | null;
  currency: string;
  className?: string;
}

function priceNote(type: PriceType, amount: number, currency: string): string {
  const words = currency === "PKR" ? lakhCrore(amount) : null;
  return [words, type === "negotiable" ? "Negotiable" : type === "fixed" ? "Fixed price" : null]
    .filter(Boolean)
    .join(" · ");
}

/** Compact price for cards and rows. */
export function PriceLine({ type, amount, currency, className }: PriceProps) {
  if (type === "on_request" || !amount) {
    return <p className={cn("text-sm font-semibold text-ink-2", className)}>Price on request</p>;
  }
  return (
    <div className={className}>
      <p className="tnum text-[17px] leading-tight font-semibold text-ink">{formatMoney(amount, currency)}</p>
      <p className="mt-0.5 text-xs text-ink-3">{priceNote(type, amount, currency)}</p>
    </div>
  );
}

/** Large price for the listing page. */
export function PriceBlock({ type, amount, currency, className }: PriceProps) {
  if (type === "on_request" || !amount) {
    return (
      <div className={className}>
        <p className="font-cond text-2xl font-bold text-ink">Price on request</p>
        <p className="mt-1 text-sm text-ink-3">Send an inquiry to get the seller&apos;s price.</p>
      </div>
    );
  }
  return (
    <div className={className}>
      <p className="tnum font-cond text-[28px] leading-none font-bold text-ink">{formatMoney(amount, currency)}</p>
      <p className="mt-1.5 text-sm text-ink-3">{priceNote(type, amount, currency)}</p>
    </div>
  );
}
