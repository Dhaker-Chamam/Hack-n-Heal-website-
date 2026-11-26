"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { INSTITUTIONS, MAX_SPECIALITIES, SKILLS, SPECIALITY_VALUES, STUDY_LEVELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { cvUploadEnabled } from "@/lib/env";
import { runMaintenance } from "@/lib/maintenance";
import { recordConsents, type ConsentKind } from "@/lib/registration";
import { clearParticipantCookie, currentPerson, type Person } from "@/lib/session";
import { FACEBOOK_ERROR, normaliseFacebook } from "@/lib/social";
import { checkPdf, deleteCv, uploadCv } from "@/lib/storage";
import { profileKindOf } from "@/lib/teams";

export type FormState = { ok: boolean; errors: Record<string, string>; message?: string };

async function requirePerson(): Promise<Person> {
  const p = await currentPerson();
  if (!p || p.status === "rejected") redirect("/lien?raison=session");
  return p;
}

const REQUIRED = "Ce champ est obligatoire.";

const profileSchema = z
  .object({
    first_name: z.string().trim().min(1, REQUIRED).max(60),
    last_name: z.string().trim().min(1, REQUIRED).max(60),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ().-]{8,20}$/, "Numéro invalide. Exemple : 20 123 456 ou +216 20 123 456."),
    institution: z.string().trim().min(1, REQUIRED).max(120),
    institution_other: z.string().trim().max(120).optional(),
    study_level: z.enum(STUDY_LEVELS, { error: REQUIRED }),
    specialities: z
      .array(z.enum(SPECIALITY_VALUES as [string, ...string[]]))
      .min(1, "Choisis au moins une spécialité.")
      .max(MAX_SPECIALITIES, `${MAX_SPECIALITIES} spécialités maximum.`),
    skills: z.array(z.enum(SKILLS)).max(8, "8 compétences maximum."),
    link_url: z.union([z.literal(""), z.url({ protocol: /^https$/, error: "Le lien doit commencer par https://" })]),
    facebook: z
      .string()
      .trim()
      .refine((s) => !s || normaliseFacebook(s) !== null, FACEBOOK_ERROR),
  })
  .superRefine((v, ctx) => {
    if (v.institution === "Autre établissement" && !v.institution_other) {
      ctx.addIssue({ code: "custom", path: ["institution_other"], message: "Précise ton établissement." });
    }
  });

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const person = await requirePerson();
  const parsed = profileSchema.safeParse({
    first_name: form.get("first_name"),
    last_name: form.get("last_name"),
    phone: form.get("phone"),
    institution: form.get("institution"),
    institution_other: form.get("institution_other") || undefined,
    study_level: form.get("study_level"),
    specialities: form.getAll("specialities").map(String),
    skills: form.getAll("skills").map(String),
    link_url: form.get("link_url") ?? "",
    facebook: form.get("facebook") ?? "",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[i.path.join("_")] ??= i.message;
    return { ok: false, errors, message: "Certains champs sont à corriger." };
  }
  const v = parsed.data;
  const institution =
    v.institution === "Autre établissement"
      ? v.institution_other!
      : (INSTITUTIONS as readonly string[]).includes(v.institution) || v.institution === person.institution
        ? v.institution
        : null;
  if (!institution) return { ok: false, errors: { institution: "Choisis un établissement dans la liste." } };
  const facebook = v.facebook ? normaliseFacebook(v.facebook) : null;

  await db()`
    update hnh.person set first_name = ${v.first_name}, last_name = ${v.last_name}, phone = ${v.phone},
      institution = ${institution}, study_level = ${v.study_level}, specialities = ${v.specialities},
      profile_kind = ${profileKindOf(v.specialities)}, skills = ${v.skills}, link_url = ${v.link_url || null},
      facebook = ${facebook?.value ?? null}, facebook_kind = ${facebook?.kind ?? null}, updated_at = now()
    where id = ${person.id}`;
  revalidatePath("/moi");
  return { ok: true, errors: {}, message: "Profil enregistré." };
}

export async function updatePreferences(_prev: FormState, form: FormData): Promise<FormState> {
  const person = await requirePerson();
  const next = {
    internship: form.get("internship") === "on",
    photo_opt_out: form.get("photo_opt_out") === "on",
    cv_share: form.get("cv_share") === "on" && !!person.cv_path,
  };
  // no radio chosen (or the question not shown): the answer stays what it was, "never asked" included
  const answer = form.get("mixed_team");
  const mixed = answer === "oui" ? true : answer === "non" ? false : person.mixed_team_ok;
  const changes: { kind: ConsentKind; granted: boolean }[] = [];
  if (next.internship !== person.internship_offers_opt_in) changes.push({ kind: "internship", granted: next.internship });
  if (next.photo_opt_out !== person.photo_opt_out) changes.push({ kind: "photo_opt_out", granted: next.photo_opt_out });
  if (next.cv_share !== person.cv_share_opt_in) changes.push({ kind: "cv_share", granted: next.cv_share });
  if (mixed !== null && mixed !== person.mixed_team_ok) changes.push({ kind: "mixed_team", granted: mixed });
  if (changes.length) {
    await db().begin(async (tx) => {
      await tx`
        update hnh.person set internship_offers_opt_in = ${next.internship}, photo_opt_out = ${next.photo_opt_out},
          cv_share_opt_in = ${next.cv_share}, mixed_team_ok = ${mixed}, updated_at = now()
        where id = ${person.id}`;
      await recordConsents(tx, person.id, changes);
    });
  }
  revalidatePath("/moi");
  return { ok: true, errors: {}, message: "Préférences enregistrées." };
}

export async function replaceCv(_prev: FormState, form: FormData): Promise<FormState> {
  const person = await requirePerson();
  if (!cvUploadEnabled()) return { ok: false, errors: {}, message: "L'envoi de CV n'est pas encore ouvert." };
  const file = form.get("cv");
  if (!(file instanceof File) || file.size === 0) return { ok: false, errors: { cv: "Choisis un fichier PDF." } };
  const err = await checkPdf(file);
  if (err) return { ok: false, errors: { cv: err } };
  const path = await uploadCv(person.id, file);
  if (!path) return { ok: false, errors: {}, message: "L'envoi a échoué. Réessaie dans un instant." };
  await db()`update hnh.person set cv_path = ${path}, cv_uploaded_at = now(), updated_at = now() where id = ${person.id}`;
  if (person.cv_path) await deleteCv(person.cv_path).catch(() => {});
  revalidatePath("/moi");
  return { ok: true, errors: {}, message: "CV enregistré." };
}

export async function removeCv(): Promise<void> {
  const person = await requirePerson();
  if (!person.cv_path) return;
  await db().begin(async (tx) => {
    await tx`
      update hnh.person set cv_path = null, cv_uploaded_at = null, cv_share_opt_in = false, updated_at = now()
      where id = ${person.id}`;
    if (person.cv_share_opt_in) await recordConsents(tx, person.id, [{ kind: "cv_share", granted: false }]);
  });
  await deleteCv(person.cv_path).catch(() => {});
  revalidatePath("/moi");
}

export async function deleteMyData(_prev: FormState, form: FormData): Promise<FormState> {
  const person = await requirePerson();
  if (form.get("confirm") !== "on") {
    return { ok: false, errors: { confirm: "Coche la case pour confirmer la suppression." } };
  }
  await db()`delete from hnh.person where id = ${person.id}`;
  if (person.cv_path) await deleteCv(person.cv_path).catch(() => {});
  await audit("participant", null, "person.self_delete");
  await clearParticipantCookie();
  await runMaintenance(true).catch(() => {});
  redirect("/inscription?supprime=1");
}

export async function signOut(): Promise<void> {
  await clearParticipantCookie();
  redirect("/lien");
}
