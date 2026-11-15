import "server-only";
import type { ZodError } from "zod";
import type { ActionResult } from "@/lib/types";

/** Read a text field from a submitted form. */
export function str(value: FormDataEntryValue | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export function fail(message: string, fieldErrors?: Record<string, string>): ActionResult {
  return { ok: false, message, fieldErrors };
}

export function fieldFail(field: string, message: string): ActionResult {
  return { ok: false, message: "Please check the highlighted field.", fieldErrors: { [field]: message } };
}

export const CHECK_FIELDS = "Please check the highlighted fields.";
