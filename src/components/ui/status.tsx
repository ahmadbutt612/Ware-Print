import { IconCheck } from "@/components/ui/icons";
import { CONDITION_LABELS, KIND_LABELS, RUNNING_LABELS, STATUS_LABELS } from "@/lib/format";
import type { Condition, ListingKind, ListingStatus, OperationalSummary, RunningStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const chip = "inline-flex items-center gap-1.5 whitespace-nowrap border px-1.5 py-[1px] text-xs font-medium leading-5";

export function RunningChip({
  status,
  className,
}: {
  status: OperationalSummary | RunningStatus | null | undefined;
  className?: string;
}) {
  if (!status) return null;
  const dot =
    status === "running"
      ? "bg-ok"
      : status === "partly_running"
        ? "bg-[linear-gradient(90deg,var(--color-ok)_50%,var(--color-warn)_50%)]"
        : "bg-warn";
  const tone =
    status === "running" ? "border-ok/35 text-ok" : status === "partly_running" ? "border-line-strong text-ink-2" : "border-warn/35 text-warn";
  return (
    <span className={cn(chip, tone, className)}>
      <span className={cn("size-2 rounded-full", dot)} aria-hidden />
      {RUNNING_LABELS[status]}
    </span>
  );
}

export function ConditionChip({ condition }: { condition: Condition | null | undefined }) {
  if (!condition) return null;
  return <span className={cn(chip, "border-line text-ink-2")}>{CONDITION_LABELS[condition]}</span>;
}

export function KindChip({ kind, count }: { kind: ListingKind; count?: number }) {
  if (kind !== "setup") return null;
  return (
    <span className={cn(chip, "border-ink bg-ink text-white")}>
      {KIND_LABELS.setup}
      {count ? ` · ${count} machines` : ""}
    </span>
  );
}

const statusTone: Record<ListingStatus, string> = {
  draft: "border-line-strong text-ink-2 bg-paper-2",
  pending: "border-warn/40 text-warn bg-warn-tint",
  changes_requested: "border-red/40 text-red bg-red-tint",
  published: "border-ok/40 text-ok bg-ok-tint",
  rejected: "border-red bg-red text-white",
  sold: "border-ink bg-ink text-white",
  archived: "border-line text-ink-3 bg-paper-2",
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return <span className={cn(chip, statusTone[status])}>{STATUS_LABELS[status]}</span>;
}

export function VerifiedMark({ label = "Verified seller", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-ok", className)}>
      <IconCheck size={13} strokeWidth={2} />
      {label}
    </span>
  );
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(chip, "border-line text-ink-2", className)}>{children}</span>;
}
