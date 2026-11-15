import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SpecTable({ rows, className }: { rows: [ReactNode, ReactNode][]; className?: string }) {
  const visible = rows.filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (visible.length === 0) return null;
  return (
    <div className={cn("overflow-hidden border border-line", className)}>
      <table className="spec-table">
        <tbody>
          {visible.map(([label, value], i) => (
            <tr key={i}>
              <th scope="row">{label}</th>
              <td className="break-words whitespace-pre-line">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
