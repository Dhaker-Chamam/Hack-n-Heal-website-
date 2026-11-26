"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import type { FormState } from "@/app/(public)/moi/actions";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Checkbox, Field, describedBy } from "../ui/field";

/** Sign-up of an author who takes part in no hackathon: a name, an email, then the link sent by email. */
export function WallJoinForm({ action }: { action: (prev: FormState, form: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, { ok: false, errors: {} });
  const err = (k: string) => state.errors[k];

  if (state.ok) {
    return (
      <div role="status">
        <Alert tone="success" title={state.message ?? "Email envoyé."}>
          Pense à regarder dans les spams. Le lien reste valable 72 heures.
        </Alert>
      </div>
    );
  }

  const input = (name: string, props: React.InputHTMLAttributes<HTMLInputElement>, hint = false) => (
    <input
      id={`join_${name}`}
      name={name}
      required
      className="control"
      aria-invalid={!!err(name) || undefined}
      aria-describedby={describedBy(`join_${name}`, hint, err(name))}
      {...props}
    />
  );

  return (
    <form
      onSubmit={(e) => {
        // sent by hand: with action={...} React resets the form afterwards, and a refused form would come back empty
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      noValidate
      className="grid max-w-xl gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="join_first_name" label="Prénom" error={err("first_name")}>
          {input("first_name", { autoComplete: "given-name", maxLength: 60 })}
        </Field>
        <Field id="join_last_name" label="Nom" error={err("last_name")}>
          {input("last_name", { autoComplete: "family-name", maxLength: 60 })}
        </Field>
      </div>
      <Field id="join_email" label="Email" hint="Pour confirmer que c'est bien toi et te prévenir quand ton message est en ligne." error={err("email")}>
        {input("email", { type: "email", inputMode: "email", autoComplete: "email", maxLength: 160 }, true)}
      </Field>
      <Field
        id="join_institution"
        label="Établissement ou organisation"
        hint="Affiché sous tes messages, avec ton prénom et l'initiale de ton nom."
        error={err("institution")}
      >
        {input("institution", { autoComplete: "organization", maxLength: 120 }, true)}
      </Field>
      <div className="grid gap-2">
        <Checkbox name="adult" id="join_adult" required error={err("adult")}>
          J&apos;ai 18 ans ou plus.
        </Checkbox>
        <Checkbox name="privacy" id="join_privacy" required error={err("privacy")}>
          J&apos;accepte le{" "}
          <Link href="/reglement#the-wall" target="_blank" className="text-emerald underline">
            règlement
          </Link>{" "}
          et la{" "}
          <Link href="/confidentialite" target="_blank" className="text-emerald underline">
            politique de données personnelles
          </Link>
          .
        </Checkbox>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi…" : "Recevoir mon lien de confirmation"}
        </Button>
      </div>
      <div aria-live="polite">{state.message && <Alert tone="error" title={state.message} role="alert" />}</div>
    </form>
  );
}
