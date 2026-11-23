import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Grey placeholder block shown while a page loads. */
export function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-paper-3", className)} />;
}

/** Wraps a loading layout and tells screen readers the page is loading. */
export function LoadingFrame({ children, label = "Loading" }: { children: ReactNode; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}
