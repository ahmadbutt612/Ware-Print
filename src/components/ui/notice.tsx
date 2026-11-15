import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  info: "border-line bg-paper-2 before:bg-ink",
  ok: "border-ok/30 bg-ok-tint before:bg-ok",
  warn: "border-warn/30 bg-warn-tint before:bg-warn",
  error: "border-red/30 bg-red-tint before:bg-red",
};

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "relative border py-3 pr-4 pl-5 text-sm before:absolute before:inset-y-[-1px] before:left-[-1px] before:w-[3px]",
        tones[tone],
        className,
      )}
    >
      {title && <p className="font-semibold text-ink">{title}</p>}
      {children && <div className={cn("text-ink-2", Boolean(title) && "mt-0.5")}>{children}</div>}
    </div>
  );
}
