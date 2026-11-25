"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import type postgres from "postgres";
import { z } from "zod";
import type { FormState } from "@/app/(public)/moi/actions";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/admin";
import { COMPETITIONS, type Competition } from "@/lib/constants";
import { db, UserError } from "@/lib/db";
import { notifyLead } from "@/lib/participant";
import { rateLimit } from "@/lib/ratelimit";
import { insertTeam, leaveTeam, seatInTeam, teamMembers } from "@/lib/registration";

/*
 * Team building by the organisers. These actions skip the time windows on purpose
 * (teams are finalised after teams_medical closes) but refuse to touch a locked team:
 * unlock it first with setTeamLock.
 */

type Tx = postgres.TransactionSql;

const fail = (message: string): FormState => ({ ok: false, errors: {}, message });
const done = (message: string): FormState => ({ ok: true, errors: {}, message });

const id = z.uuid("Sélection invalide.");
const competitionId = z.enum(["medical", "bioinfo"], { error: "Compétition invalide." });
const memberIds = z.array(id).min(1, "Sélectionne au moins une personne.").max(20, "Sélection invalide.");

// generous: finalising the teams takes many actions in a row
const allowed = (staffId: string) => rateLimit(`admin-teams:${staffId}`, 300, 600);
const TOO_MANY = "Trop d'actions en peu de temps. Attends quelques minutes.";

function toState(e: unknown): FormState {
  if (e instanceof UserError) return fail(e.message);
  console.error("[admin teams]", e);
  return fail("Une erreur technique est survenue. Réessaie dans un instant.");
}

/** Locks the participations to seat and checks each one is free and can hold a seat in this competition. */
async function lockFree(tx: Tx, competition: Competition, ids: string[]) {
  const rows = await tx<{ id: string; person_id: string; first_name: string; last_name: string }[]>`
    select pa.id, p.id as person_id, p.first_name, p.last_name
    from hnh.participation pa join hnh.person p on p.id = pa.person_id
    where pa.id in ${tx(ids)} and pa.competition = ${competition} and pa.status = 'active' and pa.team_id is null
      and (p.status = 'confirmed' or (p.status = 'pending' and p.created_at > now() - interval '72 hours'))
    for update of pa`;
  if (rows.length !== ids.length) {
    throw new UserError("Une des personnes choisies a déjà une équipe ou ne participe plus à cette compétition. Recharge la page.");
  }
  return rows;
}

/** Locks the team row for the rest of the transaction. */
async function lockTeam(tx: Tx, teamId: string, respectLock = true) {
  const [team] = await tx<{ id: string; competition: Competition; name: string; locked_at: Date | null }[]>`
    select id, competition, name, locked_at from hnh.team where id = ${teamId} for update`;
  if (!team) throw new UserError("Cette équipe n'existe plus. Recharge la page.");
  if (respectLock && team.locked_at) throw new UserError("Cette équipe est verrouillée. Déverrouille-la avant de la modifier.");
  return team;
}

export async function createTeam(competition: string, _prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin", "moderator");
  const parsed = z
    .object({
      competition: competitionId,
      name: z.string("Donne un nom à l'équipe.").trim().min(2, "Le nom doit faire entre 2 et 40 caractères.").max(40, "Le nom doit faire entre 2 et 40 caractères."),
      members: memberIds,
      lead: id.optional(),
    })
    .safeParse({ competition, name: form.get("name"), members: form.getAll("members"), lead: form.get("lead") || undefined });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { competition: c, name } = parsed.data;
  const members = [...new Set(parsed.data.members)];
  const lead = parsed.data.lead ?? members[0];
  const { max } = COMPETITIONS[c];
  if (members.length > max) return fail(`Une équipe compte ${max} membres au maximum.`);
  if (!members.includes(lead)) return fail("Le chef d'équipe doit faire partie des personnes choisies.");
  if (!(await allowed(staff.id))) return fail(TOO_MANY);

  let team: { id: string; code: string };
  try {
    team = await db().begin(async (tx) => {
      await lockFree(tx, c, members);
      const created = await insertTeam(tx, c, name, lead);
      await seatInTeam(tx, created.id, members);
      return created;
    });
  } catch (e) {
    return toState(e);
  }
  await audit("staff", staff.id, "team.admin_create", "team", team.id, { competition: c, name, members, lead });
  revalidatePath("/admin/equipes");
  return done(`Équipe « ${name} » créée avec le code ${team.code}.`);
}

export async function addMembers(competition: string, _prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin", "moderator");
  const parsed = z
    .object({ competition: competitionId, team: z.uuid("Choisis une équipe."), members: memberIds })
    .safeParse({ competition, team: form.get("team"), members: form.getAll("members") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { competition: c, team: teamId } = parsed.data;
  const members = [...new Set(parsed.data.members)];
  const { max } = COMPETITIONS[c];
  if (!(await allowed(staff.id))) return fail(TOO_MANY);

  let result: { name: string; people: { person_id: string; first_name: string; last_name: string }[] };
  try {
    result = await db().begin(async (tx) => {
      // participations before the team row: the order the participant actions lock them in
      const people = await lockFree(tx, c, members);
      const team = await lockTeam(tx, teamId);
      if (team.competition !== c) throw new UserError("Cette équipe appartient à l'autre compétition.");
      const size = (await teamMembers(tx, team.id)).length + members.length;
      if (size > max) throw new UserError(`${team.name} aurait ${size} membres : le maximum est ${max}.`);
      await seatInTeam(tx, team.id, members);
      return { name: team.name, people };
    });
  } catch (e) {
    return toState(e);
  }
  await audit("staff", staff.id, "team.admin_add_members", "team", teamId, { members });
  after(async () => {
    for (const p of result.people) await notifyLead(teamId, c, { id: p.person_id, first_name: p.first_name, last_name: p.last_name });
  });
  revalidatePath("/admin/equipes");
  const n = members.length;
  return done(`${n} membre${n > 1 ? "s ajoutés" : " ajouté"} à ${result.name}.`);
}

/** Same effect as a member leaving: back to "looking for a team", the lead passes on, an emptied team is deleted. */
export async function removeMember(participationId: string, _prev: FormState, _form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin", "moderator");
  const parsed = id.safeParse(participationId);
  if (!parsed.success) return fail("Action invalide.");
  if (!(await allowed(staff.id))) return fail(TOO_MANY);

  let teamId: string;
  try {
    teamId = await db().begin(async (tx) => {
      const [pa] = await tx<{ team_id: string | null }[]>`
        select team_id from hnh.participation where id = ${parsed.data} for update`;
      if (!pa?.team_id) throw new UserError("Cette personne n'est plus dans une équipe. Recharge la page.");
      await lockTeam(tx, pa.team_id);
      await leaveTeam(tx, parsed.data, true);
      return pa.team_id;
    });
  } catch (e) {
    return toState(e);
  }
  await audit("staff", staff.id, "team.admin_remove_member", "team", teamId, { participation: parsed.data });
  revalidatePath("/admin/equipes");
  return done("Membre retiré de l'équipe.");
}

export async function deleteTeam(teamId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin", "moderator");
  const parsed = id.safeParse(teamId);
  if (!parsed.success) return fail("Action invalide.");
  if (form.get("confirm") !== "on") return { ok: false, errors: { confirm: "Coche la case pour confirmer." } };
  if (!(await allowed(staff.id))) return fail(TOO_MANY);

  let deleted: { name: string; members: string[] };
  try {
    deleted = await db().begin(async (tx) => {
      const team = await lockTeam(tx, parsed.data);
      const [submission] = await tx`select 1 from hnh.submission where team_id = ${team.id}`;
      if (submission) throw new UserError("Cette équipe a déposé un projet : elle ne peut pas être supprimée.");
      const freed = await tx<{ id: string }[]>`
        update hnh.participation set team_id = null, seeking_team = true, joined_team_at = null
        where team_id = ${team.id} returning id`;
      await tx`delete from hnh.team where id = ${team.id}`;
      return { name: team.name, members: freed.map((r) => r.id) };
    });
  } catch (e) {
    return toState(e);
  }
  await audit("staff", staff.id, "team.admin_delete", "team", parsed.data, deleted);
  revalidatePath("/admin/equipes");
  return done(`Équipe « ${deleted.name} » supprimée.`);
}

export async function setTeamLock(teamId: string, locked: boolean, _prev: FormState, _form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin", "moderator");
  const parsed = z.object({ teamId: id, locked: z.boolean() }).safeParse({ teamId, locked });
  if (!parsed.success) return fail("Action invalide.");
  if (!(await allowed(staff.id))) return fail(TOO_MANY);

  try {
    await db().begin(async (tx) => {
      await lockTeam(tx, parsed.data.teamId, false);
      await tx`
        update hnh.team set locked_at = case when ${parsed.data.locked} then coalesce(locked_at, now()) end
        where id = ${parsed.data.teamId}`;
    });
  } catch (e) {
    return toState(e);
  }
  await audit("staff", staff.id, parsed.data.locked ? "team.lock" : "team.unlock", "team", parsed.data.teamId);
  revalidatePath("/admin/equipes");
  return done(parsed.data.locked ? "Équipe verrouillée." : "Équipe déverrouillée.");
}
