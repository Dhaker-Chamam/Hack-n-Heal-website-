"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/(public)/moi/actions";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Checkbox, Field, FieldError, describedBy } from "../ui/field";

type Comp = "medical" | "bioinfo";

export function TeamChoiceForm({
  competition,
  action,
  withCompetitionFields = false,
  allowSeek = true,
  defaultMode,
  submitLabel,
}: {
  competition: Comp;
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  withCompetitionFields?: boolean;
  allowSeek?: boolean;
  defaultMode?: "create" | "join" | "seek";
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, errors: {} });
  const [mode, setMode] = useState<string>(defaultMode ?? "");
  const c = competition;
  const err = (k: string) => state.errors[k];
  const options = [
    { v: "create", t: "Créer une équipe", d: "Tu reçois un code à partager." },
    { v: "join", t: "Rejoindre une équipe", d: "Avec le code de ton chef d'équipe." },
    ...(allowSeek ? [{ v: "seek", t: "Je cherche une équipe", d: "Les organisateurs te placent." }] : []),
  ];

  return (
    <form action={formAction} noValidate className="grid gap-6">
      {state.message && (
        <Alert tone={state.ok ? "success" : "error"} title={state.message} role={state.ok ? "status" : "alert"} />
      )}
      <fieldset aria-describedby={describedBy(`${c}_mode`, false, err(`${c}_mode`))}>
        <legend className="font-semibold text-ink">Ton choix</legend>
        <div className={`mt-3 grid gap-3 ${options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {options.map((o) => (
            <label
              key={o.v}
              className="cursor-pointer border border-graphite bg-white p-4 transition-colors duration-150 hover:border-jade has-checked:border-jade has-checked:bg-mist has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald"
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name={`${c}_mode`}
                  value={o.v}
                  className="size-4"
                  defaultChecked={o.v === defaultMode}
                  onChange={() => setMode(o.v)}
                />
                <span className="font-semibold text-ink">{o.t}</span>
              </span>
              <span className="mt-1.5 block text-small text-graphite">{o.d}</span>
            </label>
          ))}
        </div>
        <FieldError id={`${c}_mode-error`} message={err(`${c}_mode`)} />
      </fieldset>

      <div className="max-w-md">
        {mode === "create" && (
          <Field id={`${c}_team_name`} label="Nom de l'équipe" error={err(`${c}_team_name`)}>
            <input
              id={`${c}_team_name`}
              name={`${c}_team_name`}
              className="control"
              maxLength={40}
              aria-invalid={!!err(`${c}_team_name`) || undefined}
              aria-describedby={describedBy(`${c}_team_name`, false, err(`${c}_team_name`))}
            />
          </Field>
        )}
        {mode === "join" && (
          <Field
            id={`${c}_code`}
            label="Code d'équipe"
            hint={c === "medical" ? "Il commence par MED, par exemple MED-7K3Q." : "Il commence par BIO, par exemple BIO-4R9T."}
            error={err(`${c}_code`)}
          >
            <input
              id={`${c}_code`}
              name={`${c}_code`}
              className="control tabular uppercase tracking-[0.12em]"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={12}
              aria-invalid={!!err(`${c}_code`) || undefined}
              aria-describedby={describedBy(`${c}_code`, true, err(`${c}_code`))}
            />
          </Field>
        )}
        {mode === "seek" && (
          <Field id={`${c}_note`} label="Ce que tu apportes à une équipe" optional>
            <textarea id={`${c}_note`} name={`${c}_note`} rows={3} maxLength={280} className="control" />
          </Field>
        )}
      </div>

      {withCompetitionFields && c === "bioinfo" && (
        <div className="grid max-w-md gap-5">
          <Field
            id="kaggle_username"
            label="Nom d'utilisateur Kaggle"
            hint="Le hackathon bioinformatique se déroule sur Kaggle."
            error={err("kaggle_username")}
          >
            <input
              id="kaggle_username"
              name="kaggle_username"
              className="control"
              autoComplete="off"
              autoCapitalize="none"
              maxLength={60}
              aria-invalid={!!err("kaggle_username") || undefined}
              aria-describedby={describedBy("kaggle_username", true, err("kaggle_username"))}
            />
          </Field>
          <Checkbox name="has_laptop" error={err("has_laptop")}>
            J&apos;apporte mon ordinateur portable le samedi 5 décembre.
          </Checkbox>
        </div>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
