"use client";

import Form from "next/form";
import { usePathname, useSearchParams } from "next/navigation";
import { useId } from "react";
import { IconSearch } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function SearchForm({ defaultValue = "", className }: { defaultValue?: string; className?: string }) {
  const id = useId();
  return (
    <Form action="/machines" role="search" className={cn("flex w-full min-w-0", className)}>
      <label htmlFor={id} className="sr-only">
        Search machines
      </label>
      <div className="relative min-w-0 flex-1">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
        <input
          id={id}
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="Make, model or machine type — e.g. Heidelberg SM 74, slitter, Bobst"
          className="field-input h-10 rounded-r-none border-r-0 pl-9"
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>
      <button type="submit" className="btn btn-dark rounded-l-none px-5">
        Search
      </button>
    </Form>
  );
}

/** Header search that keeps the current query when you are on the browse page. */
export function HeaderSearch({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const q = pathname === "/machines" ? (params.get("q") ?? "") : "";
  return <SearchForm key={q} defaultValue={q} className={className} />;
}
