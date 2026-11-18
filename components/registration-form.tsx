"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { RegisterState } from "@/app/(public)/inscription/actions";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Checkbox, Field, FieldError, describedBy } from "./ui/field";

type Comp = "medical" | "bioinfo";

export type RegistrationFormProps = {
  action: (prev: RegisterState, form: FormData) => Promise<RegisterState>;
  open: Record<Comp, boolean>;
  deadlines: Record<Comp, string>;
  cvEnabled: boolean;
  institutions: readonly string[];
  levels: readonly string[];
  disciplines: readonly { value: string; label: string }[];
  skills: readonly string[];
};

const STEPS = ["Compétition", "Profil", "Équipe", "Finaliser"] as const;

const STEP_FIELDS: string[][] = [
  ["competitions"],
  ["first_name", "last_name", "email", "phone", "institution", "institution_other", "study_level", "discipline", "skills", "link_url"],
  ["medical_mode", "medical_team_name", "medical_code", "medical_note", "bioinfo_mode", "bioinfo_team_name", "bioinfo_code", "bioinfo_note", "kaggle_username", "has_laptop"],
  ["cv", "cv_share", "internship", "photo_opt_out", "adult", "privacy"],
];

const DRAFT_KEY = "hnh-inscription-v1";
const MAX_SKILLS = 8;

const COMP_COPY: Record<Comp, { rhythm: string; name: string; size: string; lines: string[] }> = {
  medical: {
    rhythm: "1 semaine",
    name: "Hackathon médical",
    size: "Équipes de 4 à 7",
    lines: ["Défi publié le samedi 28 novembre", "Travail à distance, mentorat possible", "Pitch devant le jury le dimanche 6 décembre"],
  },
  bioinfo: {
    rhythm: "12 heures",
    name: "Hackathon bioinformatique",
    size: "Équipes de 2 à 4",
    lines: ["Sujet dévoilé le samedi 5 décembre à l'INSAT", "Analyse de données sans interruption", "Rendu et classement sur Kaggle"],
  },
};

function stepOf(field: string): number {
  const i = STEP_FIELDS.findIndex((fs) => fs.includes(field));
  return i === -1 ? 0 : i;
}

export function RegistrationForm(props: RegistrationFormProps) {
  const { open, deadlines, cvEnabled } = props;
  const [state, formAction, pending] = useActionState(props.action, { ok: false, errors: {} });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [comps, setComps] = useState<Comp[]>([]);
  const [modes, setModes] = useState<Partial<Record<Comp, string>>>({});
  const [institution, setInstitution] = useState("");
  const [skillCount, setSkillCount] = useState(0);
  const [hasCv, setHasCv] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Server errors: show them on the first step that has one (state adjusted during render, not in an effect)
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (!state.ok) {
      const keys = Object.keys(state.errors);
      setErrors(state.errors);
      if (keys.length) setStep(Math.min(...keys.map(stepOf)));
    }
  }

  // Restore draft once
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as Record<string, string | string[]> | null;
      if (!draft) return;
      for (const el of Array.from(form.elements) as HTMLInputElement[]) {
        if (!el.name || el.type === "file" || !(el.name in draft)) continue;
        const v = draft[el.name];
        if (el.type === "checkbox" || el.type === "radio") el.checked = Array.isArray(v) ? v.includes(el.value) : v === el.value;
        else el.value = Array.isArray(v) ? v[0] : v;
      }
      syncFromForm();
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  function syncFromForm() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    setComps(fd.getAll("competitions").map(String) as Comp[]);
    setModes({ medical: String(fd.get("medical_mode") ?? ""), bioinfo: String(fd.get("bioinfo_mode") ?? "") });
    setInstitution(String(fd.get("institution") ?? ""));
    setSkillCount(fd.getAll("skills").length);
  }

  function saveDraft() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const draft: Record<string, string | string[]> = {};
    for (const key of new Set(Array.from(fd.keys()))) {
      if (key === "cv") continue;
      const all = fd.getAll(key).map(String);
      draft[key] = all.length > 1 || key === "competitions" || key === "skills" ? all : all[0];
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function validateStep(i: number): Record<string, string> {
    const form = formRef.current!;
    const fd = new FormData(form);
    const errs: Record<string, string> = {};
    const val = (k: string) => String(fd.get(k) ?? "").trim();

    if (i === 0 && fd.getAll("competitions").length === 0) errs.competitions = "Choisis au moins une compétition.";

    if (i === 1) {
      for (const k of ["first_name", "last_name", "email", "phone", "institution", "study_level"]) {
        if (!val(k)) errs[k] = "Ce champ est obligatoire.";
      }
      if (val("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val("email"))) errs.email = "Adresse email invalide.";
      if (val("phone") && !/^\+?[0-9 ().-]{8,20}$/.test(val("phone"))) {
        errs.phone = "Numéro invalide. Exemple : 20 123 456 ou +216 20 123 456.";
      }
      if (val("institution") === "Autre établissement" && !val("institution_other")) errs.institution_other = "Précise ton établissement.";
      if (!val("discipline")) errs.discipline = "Choisis ton profil principal.";
      if (val("link_url") && !/^https:\/\/\S+\.\S+/.test(val("link_url"))) errs.link_url = "Le lien doit commencer par https://";
    }

    if (i === 2) {
      for (const c of fd.getAll("competitions").map(String) as Comp[]) {
        const mode = val(`${c}_mode`);
        if (!mode) errs[`${c}_mode`] = "Choisis une option.";
        if (mode === "create" && val(`${c}_team_name`).length < 2) {
          errs[`${c}_team_name`] = "Donne un nom à ton équipe (2 caractères minimum).";
        }
        if (mode === "join" && !val(`${c}_code`)) errs[`${c}_code`] = "Saisis le code reçu de ton chef d'équipe.";
        if (c === "bioinfo") {
          if (!/^[A-Za-z0-9_.-]{3,60}$/.test(val("kaggle_username"))) {
            errs.kaggle_username = "Saisis ton nom d'utilisateur Kaggle (sans espaces).";
          }
          if (fd.get("has_laptop") !== "on") {
            errs.has_laptop = "Le hackathon bioinformatique se fait sur ton ordinateur portable.";
          }
        }
      }
    }

    if (i === 3) {
      if (fd.get("adult") !== "on") errs.adult = "Tu dois avoir 18 ans ou plus pour participer.";
      if (fd.get("privacy") !== "on") errs.privacy = "Tu dois accepter le règlement et la politique de données.";
      const cv = fd.get("cv");
      if (cv instanceof File && cv.size > 3 * 1024 * 1024) errs.cv = "Le CV dépasse 3 Mo. Exporte-le en PDF plus léger.";
    }
    return errs;
  }

  function goTo(i: number) {
    setStep(i);
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validateStep(step);
    setErrors(errs);
    if (Object.keys(errs).length) {
      focusFirstError(errs);
      return;
    }
    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }
    // last step: re-check everything before sending
    for (let i = 0; i < STEPS.length; i++) {
      const all = validateStep(i);
      if (Object.keys(all).length) {
        setErrors(all);
        goTo(i);
        return;
      }
    }
    const fd = new FormData(formRef.current!);
    startTransition(() => formAction(fd));
  }

  function focusFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs)[0];
    const el = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    el?.focus();
  }

  const err = (k: string) => errors[k];
  const anyOpen = open.medical || open.bioinfo;

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      onChange={() => {
        syncFromForm();
        saveDraft();
      }}
      className="scroll-mt-6"
      aria-describedby="form-status"
    >
      {/* Stepper */}
      <p className="mb-2 text-small font-semibold text-jade sm:hidden" aria-hidden>
        Étape <span className="tabular">{step + 1}</span> sur 4 : {STEPS[step]}
      </p>
      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Étapes de l'inscription">
        {STEPS.map((label, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined} className="min-w-0">
              <span
                aria-hidden
                className={`block h-1 ${state === "todo" ? "bg-jade/15" : state === "current" ? "bg-emerald" : "bg-jade"}`}
              />
              <span
                className={`mt-2 hidden truncate text-small sm:block ${state === "current" ? "font-semibold text-jade" : "text-graphite"}`}
              >
                <span className="tabular">{i + 1}.</span> {label}
                {state === "done" && <span className="sr-only"> (terminée)</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div id="form-status" aria-live="polite">
        {state.message && !state.ok && (
          <div className="mb-6">
            <Alert tone="error" title={state.message}>
              {state.emailExists && (
                <Link href="/lien" className="font-semibold text-emerald underline">
                  Recevoir mon lien personnel
                </Link>
              )}
            </Alert>
          </div>
        )}
      </div>

      <h2 ref={headingRef} tabIndex={-1} className="t-subhead mb-6 outline-none">
        {["Choisis ta compétition", "Ton profil", "Ton équipe", "Derniers détails"][step]}
      </h2>

      {/* Step 1 — competitions */}
      <fieldset hidden={step !== 0} aria-describedby={describedBy("competitions", true, err("competitions"))}>
        <legend className="sr-only">Compétitions</legend>
        <p id="competitions-hint" className="mb-5 max-w-measure text-graphite">
          Tu peux t&apos;inscrire aux deux, avec une équipe différente pour chacune. Les deux portent sur le cancer et
          les maladies auto-immunes, en particulier le diabète.
        </p>
        <div className="mb-4 empty:hidden">
          <FieldError id="competitions-error" message={err("competitions")} />
        </div>
        {!anyOpen && (
          <Alert tone="info" title="Les inscriptions sont closes.">
            Les deux compétitions ont fermé leurs inscriptions. Rendez-vous à l&apos;INSAT les 5 et 6 décembre.
          </Alert>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {(["medical", "bioinfo"] as Comp[]).map((c) => {
            const copy = COMP_COPY[c];
            const closed = !open[c];
            const filled = c === "medical" ? "has-checked:bg-jade" : "has-checked:bg-emerald";
            return (
              <label
                key={c}
                className={`group relative flex flex-col border p-5 md:p-6 ${
                  closed
                    ? "cursor-not-allowed border-jade/15 bg-mist"
                    : `cursor-pointer border-graphite bg-white hover:border-jade has-checked:border-transparent ${filled} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald`
                }`}
              >
                <input
                  type="checkbox"
                  name="competitions"
                  value={c}
                  disabled={closed}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className={`absolute right-5 top-5 size-5 border ${
                    closed
                      ? "border-graphite/40"
                      : c === "medical"
                        ? "border-graphite peer-checked:border-luminous peer-checked:bg-luminous"
                        : "border-graphite peer-checked:border-white peer-checked:bg-white"
                  }`}
                />
                <span
                  className={`t-headline ${
                    closed ? "text-graphite" : c === "medical" ? "text-jade peer-checked:text-luminous" : "text-emerald peer-checked:text-white"
                  }`}
                >
                  {copy.rhythm}
                </span>
                <span className={`mt-1 font-semibold ${closed ? "text-graphite" : "text-ink peer-checked:text-white"}`}>
                  {copy.name}
                </span>
                <span className={`mt-4 block border-t pt-3 text-small ${closed ? "border-jade/15 text-graphite" : "border-jade/15 text-graphite peer-checked:border-white/30 peer-checked:text-mist"}`}>
                  <span className="block font-semibold">{copy.size}</span>
                  {copy.lines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </span>
                <span
                  className={`mt-4 text-small font-semibold ${
                    closed ? "text-ink" : "text-jade peer-checked:text-white"
                  }`}
                >
                  {closed ? "Inscriptions closes" : `Inscriptions jusqu'au ${deadlines[c]}`}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Step 2 — profile */}
      <fieldset hidden={step !== 1} className="grid gap-6">
        <legend className="sr-only">Profil</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="first_name" label="Prénom" error={err("first_name")}>
            <input id="first_name" name="first_name" autoComplete="given-name" className="control" required maxLength={60}
              aria-invalid={!!err("first_name") || undefined} aria-describedby={describedBy("first_name", false, err("first_name"))} />
          </Field>
          <Field id="last_name" label="Nom" error={err("last_name")}>
            <input id="last_name" name="last_name" autoComplete="family-name" className="control" required maxLength={60}
              aria-invalid={!!err("last_name") || undefined} aria-describedby={describedBy("last_name", false, err("last_name"))} />
          </Field>
        </div>
        <p className="-mt-3 text-small text-graphite">Écris-les comme tu veux les voir sur ton badge et ton certificat.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="email" label="Email" hint="Ton lien personnel et ton QR code y seront envoyés." error={err("email")}>
            <input id="email" name="email" type="email" autoComplete="email" inputMode="email" className="control" required maxLength={160}
              aria-invalid={!!err("email") || undefined} aria-describedby={describedBy("email", true, err("email"))} />
          </Field>
          <Field id="phone" label="Téléphone" hint="Pour te joindre pendant l'événement." error={err("phone")}>
            <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className="control" required placeholder="20 123 456"
              aria-invalid={!!err("phone") || undefined} aria-describedby={describedBy("phone", true, err("phone"))} />
          </Field>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="institution" label="Établissement" error={err("institution")}>
            <select id="institution" name="institution" className="control" defaultValue="" required
              aria-invalid={!!err("institution") || undefined} aria-describedby={describedBy("institution", false, err("institution"))}>
              <option value="" disabled>Choisir…</option>
              {props.institutions.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </Field>
          <Field id="study_level" label="Niveau d'études" error={err("study_level")}>
            <select id="study_level" name="study_level" className="control" defaultValue="" required
              aria-invalid={!!err("study_level") || undefined} aria-describedby={describedBy("study_level", false, err("study_level"))}>
              <option value="" disabled>Choisir…</option>
              {props.levels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
        {institution === "Autre établissement" && (
          <Field id="institution_other" label="Nom de ton établissement" error={err("institution_other")}>
            <input id="institution_other" name="institution_other" className="control" maxLength={120}
              aria-invalid={!!err("institution_other") || undefined} aria-describedby={describedBy("institution_other", false, err("institution_other"))} />
          </Field>
        )}

        <fieldset aria-describedby={describedBy("discipline", true, err("discipline"))}>
          <legend className="font-semibold text-ink">Profil principal</legend>
          <p id="discipline-hint" className="mt-0.5 text-small text-graphite">
            Il sert à équilibrer les équipes : chacune réunit au moins un profil santé et un profil tech.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {props.disciplines.map((d) => (
              <label key={d.value}
                className="cursor-pointer border border-graphite bg-white px-4 py-2.5 text-small font-semibold text-ink transition-colors duration-150 hover:border-jade has-checked:border-jade has-checked:bg-jade has-checked:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald">
                <input type="radio" name="discipline" value={d.value} className="sr-only" />
                {d.label}
              </label>
            ))}
          </div>
          <FieldError id="discipline-error" message={err("discipline")} />
        </fieldset>

        <fieldset aria-describedby="skills-hint">
          <legend className="font-semibold text-ink">
            Compétences <span className="ml-2 font-normal text-small text-graphite">facultatif</span>
          </legend>
          <p id="skills-hint" className="mt-0.5 text-small text-graphite">
            Jusqu&apos;à {MAX_SKILLS}. Elles aident les organisateurs à former les équipes.{" "}
            <span className="tabular">({skillCount}/{MAX_SKILLS})</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {props.skills.map((s) => (
              <label key={s}
                className="cursor-pointer border border-jade/30 bg-white px-3 py-2 text-small text-ink transition-colors duration-150 hover:border-jade has-checked:border-emerald has-checked:bg-mist has-checked:font-semibold has-checked:text-jade has-disabled:cursor-not-allowed has-disabled:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald">
                <input type="checkbox" name="skills" value={s} className="sr-only"
                  onChange={(e) => {
                    if (e.currentTarget.checked && skillCount >= MAX_SKILLS) e.currentTarget.checked = false;
                  }} />
                {s}
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="link_url" label="Lien LinkedIn ou GitHub" optional error={err("link_url")}>
          <input id="link_url" name="link_url" type="url" inputMode="url" className="control" placeholder="https://"
            aria-invalid={!!err("link_url") || undefined} aria-describedby={describedBy("link_url", false, err("link_url"))} />
        </Field>
      </fieldset>

      {/* Step 3 — teams */}
      <fieldset hidden={step !== 2} className="grid gap-10">
        <legend className="sr-only">Équipe</legend>
        {(["medical", "bioinfo"] as Comp[]).map((c) => {
          const active = comps.includes(c);
          const mode = modes[c] ?? "";
          const copy = COMP_COPY[c];
          return (
            <section key={c} hidden={!active} aria-labelledby={`${c}-team-title`}>
              <h3 id={`${c}-team-title`} className="t-subhead">
                {copy.name}
                <span className="ml-3 align-middle text-small font-normal text-graphite">{copy.size.toLowerCase()}</span>
              </h3>
              <div role="radiogroup" aria-labelledby={`${c}-team-title`} aria-describedby={describedBy(`${c}_mode`, false, err(`${c}_mode`))}
                className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { v: "create", t: "Créer une équipe", d: "Tu reçois un code à partager avec tes coéquipiers." },
                  { v: "join", t: "Rejoindre une équipe", d: "Avec le code donné par ton chef d'équipe." },
                  { v: "seek", t: "Je cherche une équipe", d: c === "medical" ? "Les organisateurs te placent avant le 27 novembre." : "Les organisateurs te placent avant le 2 décembre." },
                ].map((o) => (
                  <label key={o.v}
                    className="cursor-pointer border border-graphite bg-white p-4 transition-colors duration-150 hover:border-jade has-checked:border-jade has-checked:bg-mist has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald">
                    <span className="flex items-center gap-2.5">
                      <input type="radio" name={`${c}_mode`} value={o.v} className="size-4" disabled={!active} />
                      <span className="font-semibold text-ink">{o.t}</span>
                    </span>
                    <span className="mt-1.5 block text-small text-graphite">{o.d}</span>
                  </label>
                ))}
              </div>
              <FieldError id={`${c}_mode-error`} message={err(`${c}_mode`)} />

              <div className="mt-5 max-w-md">
                {mode === "create" && (
                  <Field id={`${c}_team_name`} label="Nom de l'équipe" hint="Visible par les organisateurs et le jury." error={err(`${c}_team_name`)}>
                    <input id={`${c}_team_name`} name={`${c}_team_name`} className="control" maxLength={40} disabled={!active}
                      aria-invalid={!!err(`${c}_team_name`) || undefined} aria-describedby={describedBy(`${c}_team_name`, true, err(`${c}_team_name`))} />
                  </Field>
                )}
                {mode === "join" && (
                  <Field id={`${c}_code`} label="Code d'équipe" hint={c === "medical" ? "Il commence par MED, par exemple MED-7K3Q." : "Il commence par BIO, par exemple BIO-4R9T."} error={err(`${c}_code`)}>
                    <input id={`${c}_code`} name={`${c}_code`} className="control tabular uppercase tracking-[0.12em]" autoCapitalize="characters" autoComplete="off" maxLength={12} disabled={!active}
                      aria-invalid={!!err(`${c}_code`) || undefined} aria-describedby={describedBy(`${c}_code`, true, err(`${c}_code`))} />
                  </Field>
                )}
                {mode === "seek" && (
                  <Field id={`${c}_note`} label="Ce que tu apportes à une équipe" optional hint="Une ou deux phrases, pour aider les organisateurs à te placer." error={err(`${c}_note`)}>
                    <textarea id={`${c}_note`} name={`${c}_note`} rows={3} maxLength={280} className="control" disabled={!active} />
                  </Field>
                )}
              </div>

              {c === "bioinfo" && (
                <div className="mt-6 grid max-w-md gap-5">
                  <Field id="kaggle_username" label="Nom d'utilisateur Kaggle"
                    hint={<>Le hackathon se déroule sur Kaggle. Crée un compte sur <a className="text-emerald underline" href="https://www.kaggle.com" target="_blank" rel="noreferrer">kaggle.com</a> si tu n&apos;en as pas.</>}
                    error={err("kaggle_username")}>
                    <input id="kaggle_username" name="kaggle_username" className="control" autoComplete="off" autoCapitalize="none" maxLength={60} disabled={!active}
                      aria-invalid={!!err("kaggle_username") || undefined} aria-describedby={describedBy("kaggle_username", true, err("kaggle_username"))} />
                  </Field>
                  <Checkbox name="has_laptop" disabled={!active} error={err("has_laptop")}>
                    J&apos;apporte mon ordinateur portable le samedi 5 décembre.
                  </Checkbox>
                </div>
              )}
            </section>
          );
        })}
      </fieldset>

      {/* Step 4 — CV and consents */}
      <fieldset hidden={step !== 3} className="grid gap-8">
        <legend className="sr-only">Derniers détails</legend>
        {cvEnabled && (
          <div className="grid gap-3">
            <Field id="cv" label="CV" optional hint="PDF, 3 Mo maximum." error={err("cv")}>
              <input id="cv" name="cv" type="file" accept="application/pdf,.pdf"
                onChange={(e) => setHasCv(!!e.currentTarget.files?.length)}
                className="block w-full text-small text-graphite file:mr-4 file:min-h-10 file:cursor-pointer file:rounded-[var(--radius-ctl)] file:border file:border-jade file:bg-white file:px-4 file:font-semibold file:text-jade hover:file:bg-mist"
                aria-invalid={!!err("cv") || undefined} aria-describedby={describedBy("cv", true, err("cv"))} />
            </Field>
            <Checkbox name="cv_share" disabled={!hasCv} error={err("cv_share")}>
              Je veux que mon CV soit transmis au partenaire officiel de Hack&apos;n&apos;Heal 2026.
              <span className="mt-0.5 block text-small text-graphite">
                Seulement si tu coches. Tu peux retirer ton accord depuis ton espace jusqu&apos;à la transmission.
              </span>
            </Checkbox>
          </div>
        )}
        <div className="grid gap-2">
          <Checkbox name="internship">
            Je veux recevoir par email les offres de stage des partenaires de l&apos;événement.
          </Checkbox>
          <Checkbox name="photo_opt_out">
            Je ne souhaite pas apparaître sur les photos et vidéos de l&apos;événement.
            <span className="mt-0.5 block text-small text-graphite">Un repère sur ton badge le signalera aux photographes.</span>
          </Checkbox>
        </div>
        <div className="grid gap-2 border-t border-jade/15 pt-6">
          <Checkbox name="adult" required error={err("adult")}>
            J&apos;ai 18 ans ou plus.
          </Checkbox>
          <Checkbox name="privacy" required error={err("privacy")}>
            J&apos;accepte le{" "}
            <Link href="/reglement" target="_blank" className="text-emerald underline">règlement</Link> et la{" "}
            <Link href="/confidentialite" target="_blank" className="text-emerald underline">politique de données personnelles</Link>.
          </Checkbox>
        </div>
      </fieldset>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-jade/15 pt-6">
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => goTo(step - 1)}>
            <ArrowLeft aria-hidden className="size-4" strokeWidth={2} /> Retour
          </Button>
        )}
        <Button type="submit" disabled={pending || (step === 0 && !anyOpen)} className="ml-auto">
          {step < STEPS.length - 1 ? (
            <>
              Continuer <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
            </>
          ) : pending ? (
            "Envoi en cours…"
          ) : (
            "Envoyer mon inscription"
          )}
        </Button>
      </div>
    </form>
  );
}
