"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  COMPETITIONS,
  INSTITUTIONS,
  MAX_SPECIALITIES,
  SKILLS,
  SPECIALITY_VALUES,
  STUDY_LEVELS,
  type Competition,
} from "@/lib/constants";
import { newToken, tokenHash } from "@/lib/crypto";
import { db, UserError } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { confirmEmail } from "@/lib/emails";
import { cvUploadEnabled } from "@/lib/env";
import { rateLimit } from "@/lib/ratelimit";
import { applyTeamChoice, assertWindow, newParticipantCode, recordConsents, type TeamChoice } from "@/lib/registration";
import { ipHash } from "@/lib/request";
import { FACEBOOK_ERROR, normaliseFacebook } from "@/lib/social";
import { checkPdf, uploadCv } from "@/lib/storage";
import { profileKindOf } from "@/lib/teams";
import { runMaintenance } from "@/lib/maintenance";

export type RegisterState = {
  ok: boolean;
  errors: Record<string, string>;
  message?: string;
  emailExists?: boolean;
};

const REQUIRED = "Ce champ est obligatoire.";

const teamChoice = (prefix: Competition) =>
  z
    .object({
      mode: z.enum(["create", "join", "seek"], { error: "Choisis une option." }),
      team_name: z.string().trim().max(40, "40 caractères maximum.").optional(),
      code: z.string().trim().max(20).optional(),
      note: z.string().trim().max(280, "280 caractères maximum.").optional(),
    })
    .superRefine((v, ctx) => {
      if (v.mode === "create" && (!v.team_name || v.team_name.length < 2)) {
        ctx.addIssue({ code: "custom", path: ["team_name"], message: "Donne un nom à ton équipe (2 caractères minimum)." });
      }
      if (v.mode === "join" && !v.code) {
        ctx.addIssue({ code: "custom", path: ["code"], message: "Saisis le code reçu de ton chef d'équipe." });
      }
    })
    .transform((v) => ({ ...v, prefix }));

const schema = z
  .object({
    competitions: z
      .array(z.enum(["medical", "bioinfo"]))
      .min(1, "Choisis au moins une compétition.")
      .max(2),
    first_name: z.string().trim().min(1, REQUIRED).max(60),
    last_name: z.string().trim().min(1, REQUIRED).max(60),
    email: z.email("Adresse email invalide.").trim().toLowerCase().max(160),
    phone: z
      .string()
      .trim()
      .min(1, REQUIRED)
      .regex(/^\+?[0-9 ().-]{8,20}$/, "Numéro invalide. Exemple : 20 123 456 ou +216 20 123 456."),
    institution: z.enum(INSTITUTIONS, { error: REQUIRED }),
    institution_other: z.string().trim().max(120).optional(),
    study_level: z.enum(STUDY_LEVELS, { error: REQUIRED }),
    specialities: z
      .array(z.enum(SPECIALITY_VALUES as [string, ...string[]]))
      .min(1, "Choisis au moins une spécialité.")
      .max(MAX_SPECIALITIES, `${MAX_SPECIALITIES} spécialités maximum.`),
    skills: z.array(z.enum(SKILLS)).max(8, "8 compétences maximum."),
    link_url: z
      .union([z.literal(""), z.url({ protocol: /^https$/, error: "Lien invalide (il doit commencer par https://)." })])
      .optional(),
    facebook: z
      .string()
      .trim()
      .refine((s) => !s || normaliseFacebook(s) !== null, FACEBOOK_ERROR),
    kaggle_username: z.string().trim().max(60).optional(),
    has_laptop: z.boolean(),
    adult: z.literal(true, { error: "Tu dois avoir 18 ans ou plus pour participer." }),
    privacy: z.literal(true, { error: "Tu dois accepter le règlement et la politique de données." }),
    cv_share: z.boolean(),
    internship: z.boolean(),
    photo_opt_out: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.institution === "Autre établissement" && !v.institution_other) {
      ctx.addIssue({ code: "custom", path: ["institution_other"], message: "Précise ton établissement." });
    }
    if (v.competitions.includes("bioinfo")) {
      if (!v.kaggle_username || !/^[A-Za-z0-9_.-]{3,60}$/.test(v.kaggle_username)) {
        ctx.addIssue({ code: "custom", path: ["kaggle_username"], message: "Saisis ton nom d'utilisateur Kaggle (sans espaces)." });
      }
      if (!v.has_laptop) {
        ctx.addIssue({ code: "custom", path: ["has_laptop"], message: "Le hackathon bioinformatique se fait sur ton ordinateur portable." });
      }
    }
  });

function fieldErrors(issues: z.core.$ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.join("_") || "form";
    out[key] ??= i.message;
  }
  return out;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, Math.min(6, user.length - 2)))}@${domain}`;
}

export async function register(_prev: RegisterState, form: FormData): Promise<RegisterState> {
  const bool = (k: string) => form.get(k) === "on";
  const raw = {
    competitions: form.getAll("competitions").map(String),
    first_name: form.get("first_name"),
    last_name: form.get("last_name"),
    email: form.get("email"),
    phone: form.get("phone"),
    institution: form.get("institution"),
    institution_other: form.get("institution_other") || undefined,
    study_level: form.get("study_level"),
    specialities: form.getAll("specialities").map(String),
    skills: form.getAll("skills").map(String),
    link_url: form.get("link_url") ?? "",
    facebook: form.get("facebook") ?? "",
    kaggle_username: form.get("kaggle_username") || undefined,
    has_laptop: bool("has_laptop"),
    adult: bool("adult"),
    privacy: bool("privacy"),
    cv_share: bool("cv_share"),
    internship: bool("internship"),
    photo_opt_out: bool("photo_opt_out"),
  };

  const parsed = schema.safeParse(raw);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error.issues);

  const choices: Partial<Record<Competition, TeamChoice>> = {};
  for (const c of raw.competitions.filter((x): x is Competition => x === "medical" || x === "bioinfo")) {
    const t = teamChoice(c).safeParse({
      mode: form.get(`${c}_mode`) || undefined,
      team_name: form.get(`${c}_team_name`) || undefined,
      code: form.get(`${c}_code`) || undefined,
      note: form.get(`${c}_note`) || undefined,
    });
    if (!t.success) {
      for (const i of t.error.issues) errors[`${c}_${i.path.join("_") || "mode"}`] ??= i.message;
    } else {
      choices[c] =
        t.data.mode === "create"
          ? { mode: "create", teamName: t.data.team_name! }
          : t.data.mode === "join"
            ? { mode: "join", code: t.data.code! }
            : { mode: "seek", note: t.data.note ?? "" };
    }
  }

  const cv = form.get("cv");
  const cvFile = cv instanceof File && cv.size > 0 ? cv : null;
  if (cvFile && cvUploadEnabled()) {
    const cvError = await checkPdf(cvFile);
    if (cvError) errors.cv = cvError;
  }
  if (raw.cv_share && !cvFile) errors.cv_share = "Ajoute ton CV pour pouvoir le partager.";

  if (!parsed.success || Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Certains champs sont à corriger." };
  }
  const v = parsed.data;

  // Abuse limits: 5 registrations per hour per network, 3 attempts per day per address
  const ip = await ipHash();
  if (!(await rateLimit(`register:ip:${ip}`, 5, 3600)) || !(await rateLimit(`register:email:${v.email}`, 3, 86400))) {
    return {
      ok: false,
      errors: {},
      message: "Trop de tentatives depuis cette connexion. Réessaie dans une heure ou écris aux organisateurs.",
    };
  }

  const [existing] = await db()`select 1 from hnh.person where lower(email) = ${v.email}`;
  if (existing) {
    return {
      ok: false,
      emailExists: true,
      errors: { email: "Cette adresse est déjà inscrite." },
      message: "Cette adresse est déjà inscrite. Tu peux recevoir ton lien personnel pour modifier ton inscription.",
    };
  }

  const token = newToken();
  const personId = crypto.randomUUID();
  const facebook = v.facebook ? normaliseFacebook(v.facebook) : null;
  const institution = v.institution === "Autre établissement" ? v.institution_other! : v.institution;

  try {
    await db().begin(async (tx) => {
      for (const c of v.competitions) {
        await assertWindow(
          tx,
          COMPETITIONS[c].regWindow,
          `Les inscriptions au ${COMPETITIONS[c].label.toLowerCase()} sont closes.`,
        );
      }
      const code = await newParticipantCode(tx);
      await tx`
        insert into hnh.person (id, email, first_name, last_name, phone, institution, study_level, specialities,
          profile_kind, skills, link_url, facebook, facebook_kind, photo_opt_out, internship_offers_opt_in,
          cv_share_opt_in, access_token_hash, participant_code)
        values (${personId}, ${v.email}, ${v.first_name}, ${v.last_name}, ${v.phone}, ${institution}, ${v.study_level},
          ${v.specialities}, ${profileKindOf(v.specialities)}, ${v.skills}, ${v.link_url || null},
          ${facebook?.value ?? null}, ${facebook?.kind ?? null}, ${v.photo_opt_out},
          ${v.internship}, false, ${tokenHash(token)}, ${code})`;

      for (const c of v.competitions) {
        const [pa] = await tx<{ id: string }[]>`
          insert into hnh.participation (person_id, competition, kaggle_username, has_laptop)
          values (${personId}, ${c}, ${c === "bioinfo" ? v.kaggle_username! : null}, ${c === "bioinfo" ? v.has_laptop : null})
          returning id`;
        await applyTeamChoice(tx, c, pa.id, choices[c]!);
      }

      await recordConsents(tx, personId, [
        { kind: "adult", granted: true },
        { kind: "privacy", granted: true },
        { kind: "internship", granted: v.internship },
        { kind: "photo_opt_out", granted: v.photo_opt_out },
      ]);
    });
  } catch (e) {
    if (e instanceof UserError) {
      if (e.code.startsWith("FIELD:")) {
        return { ok: false, errors: { [e.code.slice(6)]: e.message }, message: "Certains champs sont à corriger." };
      }
      return { ok: false, errors: {}, message: e.message };
    }
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "23505") {
      return {
        ok: false,
        emailExists: true,
        errors: { email: "Cette adresse est déjà inscrite." },
        message: "Cette adresse est déjà inscrite.",
      };
    }
    console.error("[register]", e);
    return { ok: false, errors: {}, message: "Une erreur technique est survenue. Réessaie dans un instant." };
  }

  // CV upload happens after the registration is safely stored.
  let cvStored = false;
  if (cvFile && cvUploadEnabled()) {
    const path = await uploadCv(personId, cvFile);
    if (path) {
      cvStored = true;
      await db().begin(async (tx) => {
        await tx`
          update hnh.person set cv_path = ${path}, cv_uploaded_at = now(), cv_share_opt_in = ${v.cv_share}
          where id = ${personId}`;
        await recordConsents(tx, personId, [{ kind: "cv_share", granted: v.cv_share }]);
      });
    }
  }

  const mail = confirmEmail(v.first_name, token, v.competitions);
  after(async () => {
    await sendMail({ personId, to: v.email, template: "confirm", ...mail });
    await runMaintenance().catch((e) => console.error("[maintenance]", e));
  });

  const params = new URLSearchParams({ e: maskEmail(v.email) });
  if (cvFile && cvUploadEnabled() && !cvStored) params.set("cv", "0");
  redirect(`/inscription/envoyee?${params}`);
}
