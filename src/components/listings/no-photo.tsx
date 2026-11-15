import { cn } from "@/lib/utils";

export function NoPhoto({ label = "No photo", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex size-full flex-col items-center justify-center gap-2 bg-paper-2 text-ink-3", className)}>
      <svg width="34" height="34" viewBox="0 0 28 28" aria-hidden className="text-line-strong">
        <circle cx="14" cy="14" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
        <path d="M14 3v22M3 14h22" stroke="currentColor" strokeWidth="1.25" />
      </svg>
      <span className="text-xs">{label}</span>
    </div>
  );
}
