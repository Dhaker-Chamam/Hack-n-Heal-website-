"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/(public)/moi/actions";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, FieldError, describedBy } from "../ui/field";

export type ProfileDefaults = {
  first_name: string;
  last_name: string;
  phone: string;
  institution: string;
  study_level: string;
  discipline: string;
  skills: string[];
  link_url: string;
};

export function ProfileForm({
  action,
  defaults,
  institutions,
  levels,
  disciplines,
  skills,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  defaults: ProfileDefaults;
  institutions: readonly string[];
  levels: readonly string[];
  disciplines: readonly { value: string; label: string }[];
  skills: readonly string[];
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, errors: {} });
  const known = institutions.includes(defaults.institution);
  const [institution, setInstitution] = useState(known ? defaults.institution : "Autre établissement");
  const [skillCount, setSkillCount] = useState(defaults.skills.length);
  const err = (k: string) => state.errors[k];
  const input = (id: keyof ProfileDefaults, props: React.ComponentProps<"input"> = {}) => (
    <input
      id={id}
      name={id}
      defaultValue={defaults[id] as string}
      className="control"
      aria-invalid={!!err(id) || undefined}
      aria-describedby={describedBy(id, false, err(id))}
      {...props}
    />
  );

  return (
    <form action={formAction} noValidate className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="first_name" label="Prénom" error={err("first_name")}>
          {input("first_name", { autoComplete: "given-name", maxLength: 60 })}
        </Field>
        <Field id="last_name" label="Nom" error={err("last_name")}>
          {input("last_name", { autoComplete: "family-name", maxLength: 60 })}
        </Field>
        <Field id="phone" label="Téléphone" error={err("phone")}>
          {input("phone", { type: "tel", autoComplete: "tel", inputMode: "tel" })}
        </Field>
        <Field id="study_level" label="Niveau d'études" error={err("study_level")}>
          <select id="study_level" name="study_level" defaultValue={defaults.study_level} className="control">
            {levels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field id="institution" label="Établissement" error={err("institution")}>
          <select
            id="institution"
            name="institution"
            value={institution}
            onChange={(e) => setInstitution(e.currentTarget.value)}
            className="control"
          >
            {institutions.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </Field>
        {institution === "Autre établissement" && (
          <Field id="institution_other" label="Nom de ton établissement" error={err("institution_other")}>
            <input
              id="institution_other"
              name="institution_other"
              defaultValue={known ? "" : defaults.institution}
              className="control"
              maxLength={120}
              aria-invalid={!!err("institution_other") || undefined}
            />
          </Field>
        )}
      </div>

      <Field id="discipline" label="Profil principal" hint="Changer de profil modifie l'équilibre santé et tech de tes équipes." error={err("discipline")}>
        <select id="discipline" name="discipline" defaultValue={defaults.discipline} className="control sm:max-w-xs" aria-describedby="discipline-hint">
          {disciplines.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset aria-describedby="profile-skills-hint">
        <legend className="font-semibold text-ink">Compétences</legend>
        <p id="profile-skills-hint" className="mt-0.5 text-small text-graphite">
          Jusqu&apos;à 8. <span className="tabular">({skillCount}/8)</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => (
            <label
              key={s}
              className="cursor-pointer border border-jade/30 bg-white px-3 py-2 text-small text-ink transition-colors duration-150 hover:border-jade has-checked:border-emerald has-checked:bg-mist has-checked:font-semibold has-checked:text-jade has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald"
            >
              <input
                type="checkbox"
                name="skills"
                value={s}
                defaultChecked={defaults.skills.includes(s)}
                className="sr-only"
                onChange={(e) => {
                  if (e.currentTarget.checked && skillCount >= 8) {
                    e.currentTarget.checked = false;
                    return;
                  }
                  setSkillCount((n) => n + (e.currentTarget.checked ? 1 : -1));
                }}
              />
              {s}
            </label>
          ))}
        </div>
        <FieldError id="skills-error" message={err("skills")} />
      </fieldset>

      <Field id="link_url" label="Lien LinkedIn ou GitHub" optional error={err("link_url")}>
        {input("link_url", { type: "url", inputMode: "url", placeholder: "https://" })}
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer mon profil"}
        </Button>
        <span aria-live="polite" className="text-small">
          {state.message && (state.ok ? <span className="font-semibold text-emerald">{state.message}</span> : null)}
        </span>
      </div>
      {state.message && !state.ok && <Alert tone="error" title={state.message} />}
    </form>
  );
}
