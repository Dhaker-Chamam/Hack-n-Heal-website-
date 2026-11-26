"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import type postgres from "postgres";
import { redirect } from "next/navigation";
import { z } from "zod";
import { COMPETITIONS, type Competition } from "@/lib/constants";
import { db, UserError } from "@/lib/db";
import { notifyLead } from "@/lib/participant";
import { rateLimit } from "@/lib/ratelimit";
import {
  applyTeamChoice,
  assertTeamEditable,
  assertWindow,
  leaveTeam,
  type TeamChoice,
} from "@/lib/registration";
import { currentPerson, type Person } from "@/lib/session";
import type { FormState } from "../actions";

async function requirePerson(): Promise<Person> {
  const p = await currentPerson();
  if (!p || p.status !== "confirmed") redirect("/lien?raison=session");
  return p;
}

function asCompetition(c: string): Competition {
  if (c !== "medical" && c !== "bioinfo") throw new Error("bad competition");
  return c;
}

const teamWindowMessage = (c: Competition) =>
  `Les équipes du ${COMPETITIONS[c].label.toLowerCase()} sont verrouillées. Écris aux organisateurs pour tout changement.`;

function parseChoice(form: FormData, c: Competition): { choice?: TeamChoice; errors: Record<string, string> } {
  const mode = String(form.get(`${c}_mode`) ?? "");
  const name = String(form.get(`${c}_team_name`) ?? "").trim();
  const code = String(form.get(`${c}_code`) ?? "").trim();
  const note = String(form.get(`${c}_note`) ?? "").trim();
  if (mode === "create") {
    if (name.length < 2 || name.length > 40) {
      return { errors: { [`${c}_team_name`]: "Le nom doit faire entre 2 et 40 caractères." } };
    }
    return { choice: { mode: "create", teamName: name }, errors: {} };
  }
  if (mode === "join") {
    if (!code) return { errors: { [`${c}_code`]: "Saisis le code reçu de ton chef d'équipe." } };
    return { choice: { mode: "join", code }, errors: {} };
  }
  if (mode === "seek") return { choice: { mode: "seek", note: note.slice(0, 280) }, errors: {} };
  return { errors: { [`${c}_mode`]: "Choisis une option." } };
}

function toState(e: unknown): FormState {
  if (e instanceof UserError) {
    if (e.code.startsWith("FIELD:")) return { ok: false, errors: { [e.code.slice(6)]: e.message } };
    return { ok: false, errors: {}, message: e.message };
  }
  console.error("[team]", e);
  return { ok: false, errors: {}, message: "Une erreur technique est survenue. Réessaie dans un instant." };
}

/** Joins a competition the person is not in yet, with a team choice. */
export async function joinCompetition(competition: string, _prev: FormState, form: FormData): Promise<FormState> {
  const c = asCompetition(competition);
  const person = await requirePerson();
  // an author of The Wall has no hackathon profile yet, and teams are balanced on specialities
  if (person.specialities.length === 0) {
    return { ok: false, errors: {}, message: "Complète d'abord ton profil dans ton espace (téléphone, niveau d'études, spécialités), puis reviens ici." };
  }
  const { choice, errors } = parseChoice(form, c);
  let kaggle: string | null = null;
  let laptop: boolean | null = null;
  if (c === "bioinfo") {
    kaggle = String(form.get("kaggle_username") ?? "").trim();
    laptop = form.get("has_laptop") === "on";
    if (!/^[A-Za-z0-9_.-]{3,60}$/.test(kaggle)) errors.kaggle_username = "Saisis ton nom d'utilisateur Kaggle (sans espaces).";
    if (!laptop) errors.has_laptop = "Le hackathon bioinformatique se fait sur ton ordinateur portable.";
  }
  if (!choice || Object.keys(errors).length) return { ok: false, errors, message: "Certains champs sont à corriger." };
  if (!(await rateLimit(`team:${person.id}`, 10, 600))) {
    return { ok: false, errors: {}, message: "Trop de tentatives. Attends dix minutes." };
  }

  let joinedTeam: string | null = null;
  try {
    await db().begin(async (tx) => {
      await assertWindow(tx, COMPETITIONS[c].regWindow, `Les inscriptions au ${COMPETITIONS[c].label.toLowerCase()} sont closes.`);
      const [pa] = await tx<{ id: string }[]>`
        insert into hnh.participation (person_id, competition, kaggle_username, has_laptop)
        values (${person.id}, ${c}, ${kaggle}, ${laptop})
        on conflict (person_id, competition) do nothing returning id`;
      if (!pa) throw new UserError("Tu participes déjà à cette compétition.");
      const res = await applyTeamChoice(tx, c, pa.id, choice);
      if (choice.mode === "join") joinedTeam = res.teamId;
    });
  } catch (e) {
    return toState(e);
  }
  if (joinedTeam) after(() => notifyLead(joinedTeam!, c, person));
  revalidatePath("/moi");
  redirect(`/moi/equipe/${c}`);
}

/** Create, join or look for a team, leaving the current team first. */
export async function changeTeam(competition: string, _prev: FormState, form: FormData): Promise<FormState> {
  const c = asCompetition(competition);
  const person = await requirePerson();
  const { choice, errors } = parseChoice(form, c);
  if (!choice) return { ok: false, errors, message: "Certains champs sont à corriger." };
  if (choice.mode !== "seek" && !(await rateLimit(`team:${person.id}`, 10, 600))) {
    return { ok: false, errors: {}, message: "Trop de tentatives. Attends dix minutes." };
  }
  let joinedTeam: string | null = null;
  try {
    await db().begin(async (tx) => {
      await assertWindow(tx, COMPETITIONS[c].teamWindow, teamWindowMessage(c));
      const [pa] = await tx<{ id: string; team_id: string | null }[]>`
        select id, team_id from hnh.participation
        where person_id = ${person.id} and competition = ${c} and status = 'active' for update`;
      if (!pa) throw new UserError("Tu ne participes pas à cette compétition.");
      if (pa.team_id) {
        await assertTeamEditable(tx, pa.team_id);
        await leaveTeam(tx, pa.id, choice.mode === "seek");
      }
      const res = await applyTeamChoice(tx, c, pa.id, choice);
      if (choice.mode === "join") joinedTeam = res.teamId;
    });
  } catch (e) {
    return toState(e);
  }
  if (joinedTeam) after(() => notifyLead(joinedTeam!, c, person));
  revalidatePath(`/moi/equipe/${c}`);
  revalidatePath("/moi");
  return { ok: true, errors: {}, message: choice.mode === "seek" ? "Ta demande est enregistrée." : undefined };
}

async function myParticipation(tx: postgres.TransactionSql, personId: string, c: Competition) {
  const [pa] = await tx<{ id: string; team_id: string | null }[]>`
    select id, team_id from hnh.participation
    where person_id = ${personId} and competition = ${c} and status = 'active' for update`;
  if (!pa) throw new UserError("Tu ne participes pas à cette compétition.");
  return pa;
}

async function requireLead(tx: postgres.TransactionSql, personId: string, c: Competition) {
  const pa = await myParticipation(tx, personId, c);
  if (!pa.team_id) throw new UserError("Tu n'as pas d'équipe.");
  await assertTeamEditable(tx, pa.team_id);
  const [t] = await tx<{ lead_participation_id: string | null }[]>`
    select lead_participation_id from hnh.team where id = ${pa.team_id}`;
  if (t.lead_participation_id !== pa.id) throw new UserError("Seul le chef d'équipe peut faire cette action.");
  return { participationId: pa.id, teamId: pa.team_id };
}

export async function leaveMyTeam(competition: string, _prev: FormState, _form: FormData): Promise<FormState> {
  const c = asCompetition(competition);
  const person = await requirePerson();
  try {
    await db().begin(async (tx) => {
      await assertWindow(tx, COMPETITIONS[c].teamWindow, teamWindowMessage(c));
      const pa = await myParticipation(tx, person.id, c);
      if (!pa.team_id) return;
      await assertTeamEditable(tx, pa.team_id);
      await leaveTeam(tx, pa.id, true);
    });
  } catch (e) {
    return toState(e);
  }
  revalidatePath(`/moi/equipe/${c}`);
  revalidatePath("/moi");
  return { ok: true, errors: {}, message: "Tu as quitté l'équipe. Tu es maintenant en recherche d'équipe." };
}

export async function renameTeam(competition: string, _prev: FormState, form: FormData): Promise<FormState> {
  const c = asCompetition(competition);
  const person = await requirePerson();
  const name = z.string().trim().min(2).max(40).safeParse(form.get("name"));
  if (!name.success) return { ok: false, errors: { name: "Le nom doit faire entre 2 et 40 caractères." } };
  try {
    await db().begin(async (tx) => {
      await assertWindow(tx, COMPETITIONS[c].teamWindow, teamWindowMessage(c));
      const { teamId } = await requireLead(tx, person.id, c);
      const [clash] = await tx`
        select 1 from hnh.team where competition = ${c} and lower(name) = lower(${name.data}) and id <> ${teamId}`;
      if (clash) throw new UserError("Ce nom d'équipe est déjà pris.", "FIELD:name");
      await tx`update hnh.team set name = ${name.data} where id = ${teamId}`;
    });
  } catch (e) {
    return toState(e);
  }
  revalidatePath(`/moi/equipe/${c}`);
  return { ok: true, errors: {}, message: "Nom enregistré." };
}

export async function manageMember(competition: string, _prev: FormState, form: FormData): Promise<FormState> {
  const c = asCompetition(competition);
  const person = await requirePerson();
  const target = String(form.get("participation_id") ?? "");
  const op = String(form.get("op") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(target) || (op !== "remove" && op !== "lead")) {
    return { ok: false, errors: {}, message: "Action invalide." };
  }
  try {
    await db().begin(async (tx) => {
      await assertWindow(tx, COMPETITIONS[c].teamWindow, teamWindowMessage(c));
      const { teamId, participationId } = await requireLead(tx, person.id, c);
      if (target === participationId) throw new UserError("Utilise « Quitter l'équipe » pour toi-même.");
      const [m] = await tx`select 1 from hnh.participation where id = ${target} and team_id = ${teamId}`;
      if (!m) throw new UserError("Cette personne n'est plus dans l'équipe.");
      if (op === "lead") {
        await tx`update hnh.team set lead_participation_id = ${target} where id = ${teamId}`;
      } else {
        await tx`
          update hnh.participation set team_id = null, seeking_team = true, joined_team_at = null
          where id = ${target}`;
      }
    });
  } catch (e) {
    return toState(e);
  }
  revalidatePath(`/moi/equipe/${c}`);
  return { ok: true, errors: {}, message: op === "lead" ? "Le rôle de chef d'équipe a été transmis." : "Membre retiré de l'équipe." };
}

export async function withdrawCompetition(competition: string, _prev: FormState, form: FormData): Promise<FormState> {
  const c = asCompetition(competition);
  const person = await requirePerson();
  if (form.get("confirm") !== "on") return { ok: false, errors: { confirm: "Coche la case pour confirmer." } };
  try {
    await db().begin(async (tx) => {
      const pa = await myParticipation(tx, person.id, c);
      if (pa.team_id) {
        await assertTeamEditable(tx, pa.team_id);
        await leaveTeam(tx, pa.id, false);
      }
      await tx`delete from hnh.participation where id = ${pa.id}`;
    });
  } catch (e) {
    return toState(e);
  }
  revalidatePath("/moi");
  redirect("/moi");
}

