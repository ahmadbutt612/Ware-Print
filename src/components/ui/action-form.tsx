"use client";

import { createContext, startTransition, useActionState, useContext, type ReactNode } from "react";
import { Notice } from "@/components/ui/notice";
import type { ActionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export type FormAction = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

const FormStateContext = createContext<{ state: ActionResult; pending: boolean }>({
  state: { ok: false },
  pending: false,
});

export function useActionFormState() {
  return useContext(FormStateContext);
}

/**
 * A form wired to a Server Action that keeps what the user typed when the
 * server returns errors (React would otherwise clear the fields).
 */
export function ActionForm({
  action,
  children,
  className,
  id,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false } as ActionResult);
  return (
    <FormStateContext value={{ state, pending }}>
      <form
        id={id}
        action={formAction}
        noValidate
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          const data = new FormData(e.currentTarget, submitter);
          startTransition(() => formAction(data));
        }}
      >
        {children}
      </form>
    </FormStateContext>
  );
}

/** Shows the action's overall message (error or success). */
export function FormMessage({ className }: { className?: string }) {
  const { state } = useActionFormState();
  if (!state.message) return null;
  return (
    <Notice tone={state.ok ? "ok" : "error"} className={className}>
      {state.message}
    </Notice>
  );
}

/** Label + input + the server's error for this field name. */
export function FormField({
  name,
  label,
  htmlFor,
  hint,
  required,
  optional,
  className,
  children,
}: {
  name: string;
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { state } = useActionFormState();
  const error = state.fieldErrors?.[name];
  return (
    <div className={cn("min-w-0", className)} data-invalid={error ? "" : undefined}>
      <label htmlFor={htmlFor ?? name} className="field-label">
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

export function FieldError({ name, className }: { name: string; className?: string }) {
  const { state } = useActionFormState();
  const error = state.fieldErrors?.[name];
  if (!error) return null;
  return (
    <p className={cn("mt-1.5 text-[13px] font-medium text-red", className)} role="alert">
      {error}
    </p>
  );
}

export function PendingButton({
  children,
  pendingText = "Working…",
  className = "btn btn-primary",
  name,
  value,
  confirm,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
  confirm?: string;
}) {
  const { pending } = useActionFormState();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
