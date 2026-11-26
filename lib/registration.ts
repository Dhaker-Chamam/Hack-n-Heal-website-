import "server-only";
import type postgres from "postgres";
import { COMPETITIONS, CONSENT_VERSION, type Competition, type ProfileKind } from "./constants";
import { randomCode } from "./crypto";
import { UserError } from "./db";
import { competitionOfCode, normaliseJoinCode, teamBalance } from "./teams";

type Tx = postgres.TransactionSql;

export type TeamChoice =
  | { mode: "create"; teamName: string }
  | { mode: "join"; code: string }
  | { mode: "seek"; note: string };

export async function assertWindow(tx: Tx, key: string, message: string) {
  const [{ open }] = await tx<{ open: boolean }[]>`select hnh.window_is_open(${key}) as open`;
  if (!open) throw new UserError(message, "WINDOW_CLOSED");
}

export async function newParticipantCode(tx: Tx): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = `HNH-${randomCode(5)}`;
    const [hit] = await tx`select 1 from hnh.person where participant_code = ${code}`;
    if (!hit) return code;
  }
  throw new Error("participant code space exhausted");
}

async function newJoinCode(tx: Tx, competition: Competition): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = `${COMPETITIONS[competition].codePrefix}-${randomCode(4)}`;
    const [hit] = await tx`select 1 from hnh.team where join_code = ${code}`;
    if (!hit) return code;
  }
  throw new Error("join code space exhausted");
}

export type Member = {
  participation_id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  specialities: string[];
  skills: string[];
  institution: string;
  profile_kind: ProfileKind;
  person_status: "pending" | "confirmed";
  joined_team_at: Date | null;
};

/** Members holding a seat: active participation, person confirmed or pending for less than 72 h. */
export async function teamMembers(tx: postgres.Sql | Tx, teamId: string): Promise<Member[]> {
  return tx<Member[]>`
    select pa.id as participation_id, p.id as person_id, p.first_name, p.last_name, p.specialities, p.skills,
           p.institution, p.profile_kind, p.status as person_status, pa.joined_team_at
    from hnh.participation pa join hnh.person p on p.id = pa.person_id
    where pa.team_id = ${teamId} and pa.status = 'active'
      and (p.status = 'confirmed' or (p.status = 'pending' and p.created_at > now() - interval '72 hours'))
    order by pa.joined_team_at nulls last, pa.created_at`;
}

/**
 * Creates a team with a fresh join code. The lead still has to be seated with seatInTeam.
 * A name already taken in the competition throws a UserError carrying nameErrorCode.
 */
export async function insertTeam(
  tx: Tx,
  competition: Competition,
  name: string,
  leadParticipationId: string,
  nameErrorCode?: string,
): Promise<{ id: string; code: string }> {
  const [clash] = await tx`
    select 1 from hnh.team where competition = ${competition} and lower(name) = lower(${name})`;
  if (clash) throw new UserError("Ce nom d'équipe est déjà pris. Choisis-en un autre.", nameErrorCode);
  const code = await newJoinCode(tx, competition);
  const [team] = await tx<{ id: string }[]>`
    insert into hnh.team (competition, name, join_code, lead_participation_id)
    values (${competition}, ${name}, ${code}, ${leadParticipationId}) returning id`;
  return { id: team.id, code };
}

/** Gives participations their seat in a team and ends their search for one. */
export async function seatInTeam(tx: Tx, teamId: string, participationIds: string[]) {
  await tx`
    update hnh.participation
    set team_id = ${teamId}, seeking_team = false, seeking_note = null, joined_team_at = now()
    where id in ${tx(participationIds)}`;
}

/**
 * Applies a team choice to a participation inside a transaction.
 * Field-level errors are thrown as UserError with code "FIELD:<field>".
 */
export async function applyTeamChoice(
  tx: Tx,
  competition: Competition,
  participationId: string,
  choice: TeamChoice,
): Promise<{ teamId: string | null; teamName: string | null; code: string | null }> {
  const prefix = competition;
  await assertWindow(
    tx,
    COMPETITIONS[competition].teamWindow,
    `Les équipes du ${COMPETITIONS[competition].label.toLowerCase()} sont verrouillées.`,
  );

  if (choice.mode === "seek") {
    await tx`
      update hnh.participation set team_id = null, seeking_team = true, seeking_note = ${choice.note || null}
      where id = ${participationId}`;
    return { teamId: null, teamName: null, code: null };
  }

  if (choice.mode === "create") {
    const team = await insertTeam(tx, competition, choice.teamName, participationId, `FIELD:${prefix}_team_name`);
    await seatInTeam(tx, team.id, [participationId]);
    return { teamId: team.id, teamName: choice.teamName, code: team.code };
  }

  const code = normaliseJoinCode(choice.code);
  if (!code) throw new UserError("Ce code n'a pas le bon format (exemple : MED-7K3Q).", `FIELD:${prefix}_code`);
  if (competitionOfCode(code) !== competition) {
    throw new UserError(
      competition === "medical"
        ? "Ce code appartient à une équipe bioinformatique. Les codes médicaux commencent par MED."
        : "Ce code appartient à une équipe médicale. Les codes bioinformatiques commencent par BIO.",
      `FIELD:${prefix}_code`,
    );
  }
  const [team] = await tx<{ id: string; name: string; locked_at: Date | null }[]>`
    select id, name, locked_at from hnh.team where join_code = ${code} for update`;
  if (!team) {
    throw new UserError("Aucune équipe ne correspond à ce code. Vérifie-le avec ton chef d'équipe.", `FIELD:${prefix}_code`);
  }
  if (team.locked_at) throw new UserError("Cette équipe est verrouillée par les organisateurs.", `FIELD:${prefix}_code`);

  const members = await teamMembers(tx, team.id);
  if (members.some((m) => m.participation_id === participationId)) {
    return { teamId: team.id, teamName: team.name, code };
  }
  const balance = teamBalance(competition, members.map((m) => m.profile_kind));
  if (balance.full) {
    throw new UserError(
      `L'équipe ${team.name} est complète (${COMPETITIONS[competition].max} membres maximum).`,
      `FIELD:${prefix}_code`,
    );
  }
  await seatInTeam(tx, team.id, [participationId]);
  return { teamId: team.id, teamName: team.name, code };
}

export type ConsentKind = "privacy" | "adult" | "cv_share" | "internship" | "photo_opt_out" | "agora_display" | "mixed_team";

export async function recordConsents(tx: Tx, personId: string, consents: { kind: ConsentKind; granted: boolean }[]) {
  for (const c of consents) {
    await tx`
      insert into hnh.consent_event (person_id, kind, granted, text_version)
      values (${personId}, ${c.kind}, ${c.granted}, ${CONSENT_VERSION})`;
  }
}

/**
 * Removes a participation from its team. Hands the lead to the earliest
 * remaining member, and deletes the team when nobody is left.
 */
export async function leaveTeam(tx: Tx, participationId: string, seeking = true) {
  const [pa] = await tx<{ team_id: string | null }[]>`
    select team_id from hnh.participation where id = ${participationId} for update`;
  if (!pa?.team_id) return;
  const teamId = pa.team_id;
  await tx`
    update hnh.participation set team_id = null, seeking_team = ${seeking}, joined_team_at = null
    where id = ${participationId}`;
  const [next] = await tx<{ id: string }[]>`
    select id from hnh.participation where team_id = ${teamId} and status = 'active'
    order by joined_team_at nulls last, created_at limit 1`;
  if (!next) {
    await tx`
      delete from hnh.team t where t.id = ${teamId}
        and not exists (select 1 from hnh.submission s where s.team_id = t.id)`;
    return;
  }
  await tx`
    update hnh.team set lead_participation_id = ${next.id}
    where id = ${teamId} and (lead_participation_id is null or lead_participation_id = ${participationId})`;
}

/** Locks the team row and checks it can still be edited. */
export async function assertTeamEditable(tx: Tx, teamId: string) {
  const [t] = await tx<{ locked_at: Date | null }[]>`select locked_at from hnh.team where id = ${teamId} for update`;
  if (!t) throw new UserError("Cette équipe n'existe plus.");
  if (t.locked_at) throw new UserError("Cette équipe est verrouillée par les organisateurs.");
}
