import { EVENT_LABELS, formatDateTime } from "@/lib/format";
import type { ListingEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  approved: "bg-ok",
  changes_requested: "bg-red",
  rejected: "bg-red",
  unpublished: "bg-red",
  marked_sold: "bg-ink",
};

export function EventTimeline({ events }: { events: Pick<ListingEvent, "id" | "action" | "note" | "created_at">[] }) {
  if (events.length === 0) return <p className="text-sm text-ink-3">No history yet.</p>;
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className={cn("absolute top-1.5 -left-[24.5px] size-2", tone[e.action] ?? "bg-line-strong")} aria-hidden />
          <p className="text-sm font-medium">{EVENT_LABELS[e.action] ?? e.action}</p>
          <p className="text-xs text-ink-3">{formatDateTime(e.created_at)}</p>
          {e.note && <p className="mt-1 text-sm whitespace-pre-line text-ink-2">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
