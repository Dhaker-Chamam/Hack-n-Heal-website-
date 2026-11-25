import "server-only";
import type { Competition, ProfileKind } from "./constants";
import { db } from "./db";
import { sendMail } from "./email";
import { teamPlacedEmail, teammateJoinedEmail } from "./emails";
import { teamMembers, type Member } from "./registration";
import { formatMissing, teamBalance, type TeamBalance } from "./teams";

export type MyTeam = {
  id: string;
  name: string;
  join_code: string;
  locked_at: Date | null;
  lead_participation_id: string | null;
  members: Member[];
  balance: TeamBalance;
};

export type MyParticipation = {
  id: string;
  competition: Competition;
  seeking_team: boolean;
  seeking_note: string | null;
  kaggle_username: string | null;
  has_laptop: boolean | null;
  team: MyTeam | null;
  isLead: boolean;
};

export async function loadTeam(teamId: string, competition: Competition): Promise<MyTeam | null> {
  const [t] = await db()<Omit<MyTeam, "members" | "balance">[]>`
    select id, name, join_code, locked_at, lead_participation_id from hnh.team where id = ${teamId}`;
  if (!t) return null;
  const members = await teamMembers(db(), t.id);
  return { ...t, members, balance: teamBalance(competition, members.map((m) => m.profile_kind)) };
}

/** Tells the team lead, when confirmed and not the newcomer, that someone joined the team. */
export async function notifyLead(
  teamId: string,
  competition: Competition,
  newcomer: { id: string; first_name: string; last_name: string },
) {
  const team = await loadTeam(teamId, competition);
  if (!team?.lead_participation_id) return;
  const [lead] = await db()<{ id: string; email: string; first_name: string }[]>`
    select p.id, p.email, p.first_name from hnh.participation pa join hnh.person p on p.id = pa.person_id
    where pa.id = ${team.lead_participation_id} and p.status = 'confirmed' and p.id <> ${newcomer.id}`;
  if (!lead) return;
  await sendMail({
    personId: lead.id,
    to: lead.email,
    template: "teammate_joined",
    ...teammateJoinedEmail(
      lead.first_name,
      team.name,
      `${newcomer.first_name} ${newcomer.last_name}`,
      formatMissing(team.balance.missing),
    ),
  });
}

/** Tells the confirmed people among these participations that the organisers seated them in the team. */
export async function notifyPlaced(teamId: string, competition: Competition, participationIds: string[]) {
  const team = await loadTeam(teamId, competition);
  if (!team) return;
  const sql = db();
  const people = await sql<{ id: string; participation_id: string; email: string; first_name: string }[]>`
    select p.id, pa.id as participation_id, p.email, p.first_name
    from hnh.participation pa join hnh.person p on p.id = pa.person_id
    where pa.id in ${sql(participationIds)} and pa.team_id = ${teamId} and p.status = 'confirmed'`;
  for (const person of people) {
    await sendMail({
      personId: person.id,
      to: person.email,
      template: "team_placed",
      ...teamPlacedEmail(
        person.first_name,
        team.name,
        competition,
        team.join_code,
        person.participation_id === team.lead_participation_id,
        formatMissing(team.balance.missing),
      ),
    });
  }
}

export async function myParticipations(personId: string): Promise<Partial<Record<Competition, MyParticipation>>> {
  const rows = await db()<(Omit<MyParticipation, "team" | "isLead"> & { team_id: string | null })[]>`
    select id, competition, seeking_team, seeking_note, kaggle_username, has_laptop, team_id
    from hnh.participation where person_id = ${personId} and status = 'active'`;
  const out: Partial<Record<Competition, MyParticipation>> = {};
  for (const r of rows) {
    const team = r.team_id ? await loadTeam(r.team_id, r.competition) : null;
    out[r.competition] = {
      id: r.id,
      competition: r.competition,
      seeking_team: r.seeking_team,
      seeking_note: r.seeking_note,
      kaggle_username: r.kaggle_username,
      has_laptop: r.has_laptop,
      team,
      isLead: !!team && team.lead_participation_id === r.id,
    };
  }
  return out;
}

/** Every team with the profile kinds of members holding a seat (one query, for admin views). */
export async function teamsWithKinds() {
  return db()<{ id: string; competition: Competition; name: string; join_code: string; locked_at: Date | null; kinds: ProfileKind[] }[]>`
    select t.id, t.competition, t.name, t.join_code, t.locked_at,
           coalesce(array_agg(p.profile_kind) filter (where p.id is not null), '{}') as kinds
    from hnh.team t
    left join hnh.participation pa on pa.team_id = t.id and pa.status = 'active'
    left join hnh.person p on p.id = pa.person_id
      and (p.status = 'confirmed' or (p.status = 'pending' and p.created_at > now() - interval '72 hours'))
    group by t.id
    order by t.competition, lower(t.name)`;
}
