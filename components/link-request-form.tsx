"use client";

import { useActionState } from "react";
import type { LinkState } from "@/app/(public)/lien/actions";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Field, describedBy } from "./ui/field";

export function LinkRequestForm({ action }: { action: (prev: LinkState, form: FormData) => Promise<LinkState> }) {
  const [state, formAction, pending] = useActionState(action, { sent: false });

  if (state.sent) {
    return (
      <div role="status">
        <Alert tone="success" title="Demande envoyée.">
          Si cette adresse est inscrite, un nouveau lien vient d&apos;y être envoyé. Les anciens liens ne fonctionnent plus.
          Pense à regarder dans les spams.
        </Alert>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid max-w-md gap-5" noValidate>
      {state.message && <Alert tone="error" title={state.message} />}
      <Field id="email" label="Email utilisé à l'inscription" error={state.error}>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className="control"
          aria-invalid={!!state.error || undefined}
          aria-describedby={describedBy("email", false, state.error)}
        />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi…" : "Recevoir mon lien"}
        </Button>
      </div>
    </form>
  );
}
