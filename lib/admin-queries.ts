import "server-only";
import type { Competition, ProfileKind } from "./constants";
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
  discipline: string;
  profile_kind: ProfileKind;
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
  sans_equipe?: string;
};

export async function listRegistrations(f: RegistrationFilters, limit = 5000): Promise<RegistrationRow[]> {
  const sql = db();
  const q = f.q?.trim() ? `%${f.q.trim().toLowerCase()}%` : null;
  const comp = f.competition === "medical" || f.competition === "bioinfo" ? f.competition : null;
  const status = ["pending", "confirmed", "cancelled", "rejected"].includes(f.status ?? "") ? f.status! : null;
  const profile = ["health", "tech", "both", "other"].includes(f.profile ?? "") ? f.profile! : null;
  const solo = f.sans_equipe === "1";

  return sql<RegistrationRow[]>`
    select p.id, p.participant_code, p.first_name, p.last_name, p.email, p.phone, p.institution, p.study_level,
           p.discipline, p.profile_kind, p.status, p.photo_opt_out, p.internship_offers_opt_in,
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
      and (${comp}::text is null
           or (${comp} = 'medical' and pm.id is not null and (not ${solo} or pm.team_id is null))
           or (${comp} = 'bioinfo' and pb.id is not null and (not ${solo} or pb.team_id is null)))
      and (${comp}::text is not null or not ${solo} or (pm.id is not null and pm.team_id is null) or (pb.id is not null and pb.team_id is null))
    order by p.created_at desc
    limit ${limit}`;
}
