import "server-only";
import { SPECIALITY_VALUES, type Competition, type ProfileKind } from "./constants";
import { db } from "./db";

export type RegistrationRow = {
  id: string;
  participant_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  institution: string;
  study_level: string;
  specialities: string[];
  profile_kind: ProfileKind;
  facebook: string | null;
  status: "pending" | "confirmed" | "cancelled" | "rejected";
  photo_opt_out: boolean;
  internship_offers_opt_in: boolean;
  has_cv: boolean;
  cv_share_opt_in: boolean;
  created_at: Date;
  email_confirmed_at: Date | null;
  medical_team: string | null;
  medical_code: string | null;
  medical_in: boolean;
  bioinfo_team: string | null;
  bioinfo_code: string | null;
  bioinfo_in: boolean;
  kaggle_username: string | null;
  has_laptop: boolean | null;
};

export type RegistrationFilters = {
  q?: string;
  competition?: Competition | "";
  status?: string;
  profile?: string;
  tag?: string | string[];
  sans_equipe?: string;
};

/** Speciality tags of a filter: repeated ?tag= values or one comma-separated value. Unknown tags are dropped. */
export function tagFilter(tag: string | string[] | undefined): string[] {
  return [tag ?? []]
    .flat()
    .flatMap((t) => t.split(","))
    .filter((t) => SPECIALITY_VALUES.includes(t));
}

export async function listRegistrations(f: RegistrationFilters, limit = 5000): Promise<RegistrationRow[]> {
  const sql = db();
  const q = f.q?.trim() ? `%${f.q.trim().toLowerCase()}%` : null;
  const comp = f.competition === "medical" || f.competition === "bioinfo" ? f.competition : null;
  const status = ["pending", "confirmed", "cancelled", "rejected"].includes(f.status ?? "") ? f.status! : null;
  const profile = ["health", "tech", "both", "other"].includes(f.profile ?? "") ? f.profile! : null;
  const tags = tagFilter(f.tag);
  const anyTag = tags.length ? tags : null;
  const solo = f.sans_equipe === "1";

  return sql<RegistrationRow[]>`
    select p.id, p.participant_code, p.first_name, p.last_name, p.email, p.phone, p.institution, p.study_level,
           p.specialities, p.profile_kind, p.facebook, p.status, p.photo_opt_out, p.internship_offers_opt_in,
           (p.cv_path is not null) as has_cv, p.cv_share_opt_in, p.created_at, p.email_confirmed_at,
           tm.name as medical_team, tm.join_code as medical_code, (pm.id is not null) as medical_in,
           tb.name as bioinfo_team, tb.join_code as bioinfo_code, (pb.id is not null) as bioinfo_in,
           pb.kaggle_username, pb.has_laptop
    from hnh.person p
    left join hnh.participation pm on pm.person_id = p.id and pm.competition = 'medical' and pm.status = 'active'
    left join hnh.team tm on tm.id = pm.team_id
    left join hnh.participation pb on pb.person_id = p.id and pb.competition = 'bioinfo' and pb.status = 'active'
    left join hnh.team tb on tb.id = pb.team_id
    where p.anonymized_at is null
      and (${q}::text is null or lower(p.first_name || ' ' || p.last_name || ' ' || p.email || ' ' || p.participant_code || ' ' || p.institution) like ${q})
      and (${status}::text is null or p.status = ${status})
      and (${profile}::text is null or p.profile_kind = ${profile})
      and (${anyTag}::text[] is null or p.specialities && ${anyTag}::text[])
      and (${comp}::text is null
           or (${comp} = 'medical' and pm.id is not null and (not ${solo} or pm.team_id is null))
           or (${comp} = 'bioinfo' and pb.id is not null and (not ${solo} or pb.team_id is null)))
      and (${comp}::text is not null or not ${solo} or (pm.id is not null and pm.team_id is null) or (pb.id is not null and pb.team_id is null))
    order by p.created_at desc
    limit ${limit}`;
}

export type BuilderPerson = {
  participation_id: string;
  person_id: string;
  team_id: string | null;
  first_name: string;
  last_name: string;
  institution: string;
  specialities: string[];
  skills: string[];
  profile_kind: ProfileKind;
  person_status: "pending" | "confirmed";
  seeking_team: boolean;
  seeking_note: string | null;
};

export type BuilderTeam = {
  id: string;
  name: string;
  join_code: string;
  locked: boolean;
  lead_participation_id: string | null;
  has_submission: boolean;
  members: BuilderPerson[];
};

/**
 * Everything /admin/equipes shows for one competition: its teams with the members holding a seat,
 * and the active participations without a team. Same seat rule as teamMembers.
 */
export async function teamBuilderData(competition: Competition): Promise<{ teams: BuilderTeam[]; free: BuilderPerson[] }> {
  const sql = db();
  const [teams, people] = await Promise.all([
    sql<Omit<BuilderTeam, "members">[]>`
      select t.id, t.name, t.join_code, (t.locked_at is not null) as locked, t.lead_participation_id,
             exists (select 1 from hnh.submission s where s.team_id = t.id) as has_submission
      from hnh.team t where t.competition = ${competition}
      order by lower(t.name)`,
    sql<BuilderPerson[]>`
      select pa.id as participation_id, p.id as person_id, pa.team_id, p.first_name, p.last_name, p.institution,
             p.specialities, p.skills, p.profile_kind, p.status as person_status, pa.seeking_team, pa.seeking_note
      from hnh.participation pa join hnh.person p on p.id = pa.person_id
      where pa.competition = ${competition} and pa.status = 'active'
        and (p.status = 'confirmed' or (p.status = 'pending' and p.created_at > now() - interval '72 hours'))
      order by pa.joined_team_at nulls last, pa.created_at`,
  ]);
  return {
    teams: teams.map((t) => ({ ...t, members: people.filter((p) => p.team_id === t.id) })),
    free: people.filter((p) => !p.team_id),
  };
}
