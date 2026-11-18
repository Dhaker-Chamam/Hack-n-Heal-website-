"use client";

import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/(public)/moi/actions";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

/**
 * A form whose errors are reported as one message under the fields.
 * For small forms: a confirmation box, a single input, a button.
 */
export function SimpleActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Enregistrement…",
  variant = "primary",
  size = "md",
  className = "",
  inline = false,
}: {
  action: Action;
  children?: ReactNode;
  submitLabel: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "md" | "sm";
  className?: string;
  inline?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, errors: {} });
  const errors = Object.values(state.errors);
  const message = errors.length ? errors.join(" ") : state.message;
  return (
    <form action={formAction} className={className} noValidate>
      <div className={inline ? "flex flex-wrap items-end gap-3" : "grid gap-4"}>
        {children}
        <div>
          <Button type="submit" variant={variant} size={size} disabled={pending}>
            {pending ? pendingLabel : submitLabel}
          </Button>
        </div>
      </div>
      <div aria-live="polite">
        {message && (
          <div className="mt-4">
            <Alert tone={state.ok ? "success" : "error"} title={message} role={state.ok ? "status" : "alert"} />
          </div>
        )}
      </div>
    </form>
  );
}
