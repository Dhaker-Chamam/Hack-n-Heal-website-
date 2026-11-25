"use client";

import { startTransition, useActionState, useState } from "react";
import type { FormState } from "@/app/(public)/moi/actions";
import { AGORA_CATEGORIES } from "@/lib/constants";
import { WALL_BODY_MAX, WALL_BODY_MIN, textLength, wallWarnings } from "@/lib/wall";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { FieldError, describedBy } from "../ui/field";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

/**
 * Writes or corrects a post. A refused message keeps everything the author typed.
 * `consent` asks for the display agreement, needed for a new post only.
 */
export function PostForm({
  action,
  defaults,
  consent = false,
  submitLabel,
  idPrefix = "post",
}: {
  action: Action;
  defaults?: { category: string; body: string; link_url: string };
  consent?: boolean;
  submitLabel: string;
  idPrefix?: string;
}) {
  const [category, setCategory] = useState(defaults?.category ?? "");
  const [body, setBody] = useState(defaults?.body ?? "");
  const [link, setLink] = useState(defaults?.link_url ?? "");
  const [agreed, setAgreed] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: FormState, form: FormData) => {
      const result = await action(prev, form);
      if (result.ok && !defaults) {
        setCategory("");
        setBody("");
        setLink("");
        setAgreed(false);
      }
      return result;
    },
    { ok: false, errors: {} },
  );
  const err = (k: string) => state.errors[k];
  const id = (k: string) => `${idPrefix}_${k}`;
  const warnings = wallWarnings(body);
  const length = textLength(body);

  return (
    <form
      onSubmit={(e) => {
        // sent by hand: with action={...} React resets the form afterwards, and ticked boxes look unticked
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      noValidate
      className="grid gap-6"
    >
      <fieldset aria-describedby={describedBy(id("category"), false, err("category"))}>
        <legend className="font-semibold text-ink">Catégorie</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(AGORA_CATEGORIES).map(([value, label]) => (
            <label
              key={value}
              className="cursor-pointer border border-graphite bg-white px-4 py-2.5 text-small font-semibold text-ink transition-colors duration-150 hover:border-jade has-checked:border-jade has-checked:bg-jade has-checked:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald"
            >
              <input type="radio" name="category" value={value} checked={category === value} onChange={() => setCategory(value)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
        <FieldError id={`${id("category")}-error`} message={err("category")} />
      </fieldset>

      <div>
        <label htmlFor={id("body")} className="block font-semibold text-ink">
          Ton message
        </label>
        <p id={`${id("body")}-hint`} className="mt-0.5 text-small text-graphite">
          De {WALL_BODY_MIN} à {WALL_BODY_MAX} caractères, sans image.{" "}
          <span className="tabular">
            ({length}/{WALL_BODY_MAX})
          </span>
        </p>
        <textarea
          id={id("body")}
          name="body"
          rows={7}
          maxLength={WALL_BODY_MAX}
          value={body}
          onChange={(e) => setBody(e.currentTarget.value)}
          className="control mt-2"
          aria-invalid={!!err("body") || undefined}
          aria-describedby={describedBy(id("body"), true, err("body"))}
        />
        <FieldError id={`${id("body")}-error`} message={err("body")} />
        <div aria-live="polite">
          {warnings.length > 0 && (
            <div className="mt-3">
              <Alert tone="info" title={`Ton message semble contenir ${warnings.join(", ")}.`}>
                Aucun patient ne doit pouvoir être reconnu, et tes coordonnées n&apos;ont pas leur place ici. Tu peux quand même
                l&apos;envoyer : un modérateur le relira.
              </Alert>
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={id("link_url")} className="block font-semibold text-ink">
          Lien <span className="ml-2 font-normal text-small text-graphite">facultatif</span>
        </label>
        <p id={`${id("link_url")}-hint`} className="mt-0.5 text-small text-graphite">
          Un seul lien, en https. Seul son nom de domaine est affiché.
        </p>
        <input
          id={id("link_url")}
          name="link_url"
          type="url"
          inputMode="url"
          placeholder="https://"
          maxLength={300}
          value={link}
          onChange={(e) => setLink(e.currentTarget.value)}
          className="control mt-2"
          aria-invalid={!!err("link_url") || undefined}
          aria-describedby={describedBy(id("link_url"), true, err("link_url"))}
        />
        <FieldError id={`${id("link_url")}-error`} message={err("link_url")} />
      </div>

      {consent && (
        <div>
          <label htmlFor={id("display")} className="flex cursor-pointer items-start gap-3 py-1">
            <input
              type="checkbox"
              id={id("display")}
              name="display"
              checked={agreed}
              onChange={(e) => setAgreed(e.currentTarget.checked)}
              aria-invalid={err("display") ? true : undefined}
              aria-describedby={err("display") ? `${id("display")}-error` : undefined}
              className="mt-1 size-5 shrink-0 cursor-pointer"
            />
            <span className="text-ink">
              J&apos;accepte que ce message soit affiché publiquement avec mon prénom, l&apos;initiale de mon nom et mon
              établissement.
            </span>
          </label>
          <FieldError id={`${id("display")}-error`} message={err("display")} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi…" : submitLabel}
        </Button>
      </div>
      <div aria-live="polite">
        {state.message && <Alert tone={state.ok ? "success" : "error"} title={state.message} role={state.ok ? "status" : "alert"} />}
      </div>
    </form>
  );
}
