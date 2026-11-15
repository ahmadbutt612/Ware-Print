import Link from "next/link";
import { cn } from "@/lib/utils";

/** Registration mark in a red square — the target printers use to align colours. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden className={className}>
      <rect width="28" height="28" fill="#C8102E" />
      <circle cx="14" cy="14" r="6.25" fill="none" stroke="#fff" strokeWidth="1.75" />
      <path d="M14 4v20M4 14h20" stroke="#fff" strokeWidth="1.75" />
      <circle cx="14" cy="14" r="2.25" fill="#fff" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 text-ink", className)} aria-label="Ware Print home">
      <LogoMark />
      <span className="font-cond text-[19px] leading-none font-bold tracking-[0.14em] uppercase">
        Ware<span className="text-red">Print</span>
      </span>
    </Link>
  );
}
