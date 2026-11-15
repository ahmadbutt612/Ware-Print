import { SpecTable } from "@/components/listings/spec-table";
import { RunningChip } from "@/components/ui/status";
import { categorySingular } from "@/lib/categories";
import { CONDITION_LABELS, RUNNING_LABELS } from "@/lib/format";
import type { ListingFull, ListingItem } from "@/lib/types";

function itemRows(item: ListingItem): [string, string][] {
  return [
    ["Machine type", categorySingular(item.category)],
    ["Manufacturer", item.manufacturer],
    ["Model", item.model],
    ["Year of manufacture", item.year ? String(item.year) : ""],
    ["Condition", CONDITION_LABELS[item.condition]],
    [
      "Running status",
      item.running_status
        ? `${RUNNING_LABELS[item.running_status]}${item.status_note ? `\n${item.status_note}` : ""}`
        : "",
    ],
    ...(item.specs ?? []).filter((s) => s.label && s.value).map((s) => [s.label, s.value] as [string, string]),
  ];
}

function Extras({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold">Included with this machine</h4>
      <p className="mt-1 text-sm whitespace-pre-line text-ink-2">{text}</p>
    </div>
  );
}

export function MachineDetails({ listing }: { listing: ListingFull }) {
  const items = [...listing.listing_items].sort((a, b) => a.position - b.position);
  if (items.length === 0) return null;

  if (listing.kind === "single") {
    const item = items[0];
    return (
      <section aria-labelledby="specs-heading">
        <h2 id="specs-heading" className="font-cond text-xl font-bold">
          Specifications
        </h2>
        <SpecTable rows={itemRows(item)} className="mt-3" />
        <Extras text={item.extras} />
      </section>
    );
  }

  return (
    <section aria-labelledby="specs-heading">
      <h2 id="specs-heading" className="font-cond text-xl font-bold">
        Machines in this setup <span className="font-normal text-ink-3">({items.length})</span>
      </h2>
      <p className="mt-1 text-sm text-ink-2">These machines are sold together as one setup.</p>
      <ol className="mt-4 space-y-4">
        {items.map((item, i) => (
          <li key={item.id} className="border border-line">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line bg-paper-2 px-4 py-3">
              <div className="min-w-0">
                <p className="eyebrow">
                  Machine {i + 1} · {categorySingular(item.category)}
                </p>
                <h3 className="mt-0.5 font-semibold">
                  {item.manufacturer} {item.model}
                  {item.year ? <span className="font-normal text-ink-3"> ({item.year})</span> : null}
                </h3>
              </div>
              <RunningChip status={item.running_status} />
            </div>
            <div className="p-4">
              <SpecTable rows={itemRows(item)} />
              <Extras text={item.extras} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
