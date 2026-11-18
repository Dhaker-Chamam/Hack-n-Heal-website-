"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, describedBy } from "@/components/ui/field";
import type { StaffLoginState } from "./actions";

export function StaffLoginForm({ action }: { action: (p: StaffLoginState, f: FormData) => Promise<StaffLoginState> }) {
  const [state, formAction, pending] = useActionState(action, { sent: false });
  if (state.sent) {
    return (
      <Alert tone="success" title="Si cette adresse a un accès organisateur, un lien de connexion vient d'y être envoyé." role="status">
        Il expire dans 20 minutes.
      </Alert>
    );
  }
  return (
    <form action={formAction} noValidate className="grid gap-5">
      <Field id="email" label="Email organisateur" error={state.error}>
        <input id="email" name="email" type="email" autoComplete="email" required className="control"
          aria-invalid={!!state.error || undefined} aria-describedby={describedBy("email", false, state.error)} />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>{pending ? "Envoi…" : "Recevoir un lien de connexion"}</Button>
      </div>
    </form>
  );
}
