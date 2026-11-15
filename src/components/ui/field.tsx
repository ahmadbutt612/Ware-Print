import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required && <span className="text-red"> *</span>}
        {optional && <span className="font-normal text-ink-3"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[13px] font-medium text-red" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}
