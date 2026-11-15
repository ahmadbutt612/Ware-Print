import type { ReactNode } from "react";

export function DashHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 font-cond text-[28px] leading-tight font-bold break-words">{title}</h1>
        {description && <div className="mt-1.5 max-w-2xl text-sm text-ink-2">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatTile({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="bg-paper p-4">
      <p className="text-[13px] text-ink-2">{label}</p>
      <p className="tnum mt-1 font-cond text-[28px] leading-none font-bold">{value}</p>
      {note && <p className="mt-1.5 text-xs text-ink-3">{note}</p>}
    </div>
  );
}
