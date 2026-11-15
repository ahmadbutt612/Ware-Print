import Link from "next/link";
import { cn } from "@/lib/utils";

/** Page links: « 1 … 4 5 [6] 7 8 … 20 » */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const cell = "grid h-9 min-w-9 place-items-center border px-3 text-sm";

  return (
    <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(cell, "border-line-strong hover:border-ink")} rel="prev">
          Previous
        </Link>
      ) : (
        <span className={cn(cell, "border-line text-ink-3")}>Previous</span>
      )}
      {list.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - list[i - 1] > 1 && <span className="px-1 text-ink-3">…</span>}
          {p === page ? (
            <span aria-current="page" className={cn(cell, "border-ink bg-ink font-semibold text-white")}>
              {p}
            </span>
          ) : (
            <Link href={hrefFor(p)} className={cn(cell, "border-line-strong hover:border-ink")}>
              {p}
            </Link>
          )}
        </span>
      ))}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={cn(cell, "border-line-strong hover:border-ink")} rel="next">
          Next
        </Link>
      ) : (
        <span className={cn(cell, "border-line text-ink-3")}>Next</span>
      )}
    </nav>
  );
}
