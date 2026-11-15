"use client";

import { IconDown, IconPlus, IconUp, IconX } from "@/components/ui/icons";
import { Field } from "@/components/ui/field";
import { CATEGORIES, CATEGORY_GROUPS, COMMON_SPECS, getCategory } from "@/lib/categories";
import { LIMITS, type ItemDraft } from "@/lib/listing-input";
import { MANUFACTURERS } from "@/lib/manufacturers";
import { cn } from "@/lib/utils";

export function MachineFields({
  index,
  item,
  isSetup,
  count,
  errors,
  onChange,
  onRemove,
  onMove,
}: {
  index: number;
  item: ItemDraft;
  isSetup: boolean;
  count: number;
  errors: Record<string, string>;
  onChange: (item: ItemDraft) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
}) {
  const key = (field: string) => `items.${index}.${field}`;
  const err = (field: string) => errors[key(field)];
  const id = (field: string) => `item-${index}-${field}`;
  const category = getCategory(item.category);
  const set = <K extends keyof ItemDraft>(field: K, value: ItemDraft[K]) => onChange({ ...item, [field]: value });

  function suggestedRows(slug: string) {
    const cat = getCategory(slug);
    return (cat?.specs ?? []).map((label) => ({ label, value: "" }));
  }

  function changeCategory(slug: string) {
    const hasValues = item.specs.some((s) => s.value.trim());
    onChange({ ...item, category: slug, specs: hasValues ? item.specs : suggestedRows(slug) });
  }

  function addSuggested() {
    const present = new Set(item.specs.map((s) => s.label.trim().toLowerCase()));
    const extra = [...(category?.specs ?? []), ...COMMON_SPECS]
      .filter((label) => !present.has(label.toLowerCase()))
      .map((label) => ({ label, value: "" }));
    set("specs", [...item.specs, ...extra].slice(0, LIMITS.specs));
  }

  function setSpec(j: number, field: "label" | "value", value: string) {
    set(
      "specs",
      item.specs.map((s, k) => (k === j ? { ...s, [field]: value } : s)),
    );
  }

  const filled = item.specs.filter((s) => s.label.trim() && s.value.trim()).length;
  const heading = [item.manufacturer, item.model].filter(Boolean).join(" ");

  return (
    <div className={cn(isSetup && "border border-line")}>
      {isSetup && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper-2 px-4 py-2.5">
          <p className="min-w-0 flex-1 truncate text-sm">
            <span className="font-mono text-xs font-medium text-red">MACHINE {index + 1}</span>
            {(category || heading) && (
              <span className="ml-2 font-medium">
                {[category?.singular, heading].filter(Boolean).join(" · ")}
              </span>
            )}
          </p>
          <button type="button" className="btn btn-outline btn-sm px-2" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
            <IconUp size={14} />
          </button>
          <button type="button" className="btn btn-outline btn-sm px-2" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Move down">
            <IconDown size={14} />
          </button>
          <button type="button" className="btn btn-outline btn-sm text-red" onClick={onRemove} disabled={count <= 1}>
            Remove
          </button>
        </div>
      )}

      <div className={cn("space-y-5", isSetup && "p-4")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Machine type" htmlFor={id("category")} required error={err("category")}>
            <select
              id={id("category")}
              value={item.category}
              onChange={(e) => changeCategory(e.target.value)}
              className="field-input"
              aria-invalid={Boolean(err("category"))}
              data-field-error={err("category") ? "true" : undefined}
            >
              <option value="">Choose…</option>
              {CATEGORY_GROUPS.map((g) => (
                <optgroup key={g.id} label={g.label}>
                  {CATEGORIES.filter((c) => c.group === g.id).map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Manufacturer" htmlFor={id("manufacturer")} required error={err("manufacturer")} hint="Write “Local” if made locally.">
            <input
              id={id("manufacturer")}
              value={item.manufacturer}
              onChange={(e) => set("manufacturer", e.target.value)}
              list="manufacturer-list"
              maxLength={80}
              className="field-input"
              aria-invalid={Boolean(err("manufacturer"))}
              data-field-error={err("manufacturer") ? "true" : undefined}
            />
          </Field>
          <Field label="Model" htmlFor={id("model")} required error={err("model")} hint="As on the nameplate, e.g. SM 74-4-P, SP 102-E.">
            <input
              id={id("model")}
              value={item.model}
              onChange={(e) => set("model", e.target.value)}
              maxLength={80}
              className="field-input"
              aria-invalid={Boolean(err("model"))}
              data-field-error={err("model") ? "true" : undefined}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Year made" htmlFor={id("year")} optional error={err("year")}>
              <input
                id={id("year")}
                value={item.year}
                onChange={(e) => set("year", e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                placeholder="e.g. 2008"
                className="field-input"
                aria-invalid={Boolean(err("year"))}
              />
            </Field>
            <Field label="Condition" htmlFor={id("condition")}>
              <select
                id={id("condition")}
                value={item.condition}
                onChange={(e) => set("condition", e.target.value as ItemDraft["condition"])}
                className="field-input"
              >
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
                <option value="new">New</option>
              </select>
            </Field>
          </div>
        </div>

        <fieldset data-field-error={err("runningStatus") ? "true" : undefined}>
          <legend className="field-label">
            Is this machine running right now? <span className="text-red">*</span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["running", "Running", "Working and can be shown under power"],
                ["not_running", "Not running", "Stopped, dismantled, or needs repair"],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 border p-3 has-[:checked]:border-ink has-[:checked]:bg-paper-2",
                  err("runningStatus") ? "border-red" : "border-line-strong",
                )}
              >
                <input
                  type="radio"
                  name={id("running")}
                  value={value}
                  checked={item.runningStatus === value}
                  onChange={() => set("runningStatus", value)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-ink-3">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          {err("runningStatus") && <p className="mt-1.5 text-[13px] font-medium text-red">{err("runningStatus")}</p>}
          <input
            value={item.statusNote}
            onChange={(e) => set("statusNote", e.target.value)}
            maxLength={LIMITS.note}
            placeholder={
              item.runningStatus === "not_running"
                ? "What is needed? e.g. Main motor needs rewinding; stopped since March 2025"
                : "Optional note, e.g. Running daily in production, can be seen under power"
            }
            aria-label="Running status note"
            className="field-input mt-2"
          />
        </fieldset>

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="field-label mb-0">Specifications</h4>
            <p className="tnum text-xs text-ink-3">
              {filled} filled · empty rows are not shown to buyers
            </p>
          </div>
          {item.specs.length > 0 ? (
            <div className="mt-2 divide-y divide-line border border-line">
              {item.specs.map((spec, j) => (
                <div key={j} className="flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
                  <input
                    value={spec.label}
                    onChange={(e) => setSpec(j, "label", e.target.value)}
                    list={`spec-labels-${index}`}
                    maxLength={LIMITS.specLabel}
                    placeholder="Specification, e.g. Max sheet size (mm)"
                    aria-label={`Specification name ${j + 1}`}
                    className="field-input bg-paper-2 sm:w-[42%]"
                  />
                  <div className="flex flex-1 gap-2">
                    <input
                      value={spec.value}
                      onChange={(e) => setSpec(j, "value", e.target.value)}
                      maxLength={LIMITS.specValue}
                      placeholder="Value"
                      aria-label={`Value for ${spec.label || `specification ${j + 1}`}`}
                      className="field-input"
                    />
                    <button
                      type="button"
                      onClick={() => set("specs", item.specs.filter((_, k) => k !== j))}
                      className="btn btn-outline shrink-0 px-2.5"
                      aria-label="Remove row"
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 border border-dashed border-line-strong p-3 text-sm text-ink-3">
              Choose the machine type to get suggested fields, or add your own rows.
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={item.specs.length >= LIMITS.specs}
              onClick={() => set("specs", [...item.specs, { label: "", value: "" }])}
            >
              <IconPlus size={14} /> Add a row
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={addSuggested} disabled={item.specs.length >= LIMITS.specs}>
              Add suggested fields
            </button>
          </div>
          <datalist id={`spec-labels-${index}`}>
            {[...(category?.specs ?? []), ...COMMON_SPECS].map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
        </div>

        <Field
          label="Included with the machine"
          htmlFor={id("extras")}
          optional
          hint="Spare parts, cylinders, dies, anilox rolls, manuals, tools…"
        >
          <textarea
            id={id("extras")}
            value={item.extras}
            onChange={(e) => set("extras", e.target.value)}
            maxLength={LIMITS.extras}
            rows={2}
            className="field-input min-h-16"
          />
        </Field>
      </div>
    </div>
  );
}

export function ManufacturerList() {
  return (
    <datalist id="manufacturer-list">
      {MANUFACTURERS.map((m) => (
        <option key={m} value={m} />
      ))}
    </datalist>
  );
}
