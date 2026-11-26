-- Hack'n'Heal 2026 — The Wall open to people who are not registered to a hackathon,
-- co-authors on a post, the mixed-team answer, and three calendar corrections.
-- Additive: no existing row loses data. The schema part can run again; the calendar part is meant to
-- run once, since a later run would undo a date an organiser changed in /admin/calendrier meanwhile.

-- ---------------------------------------------------------------- people
-- An author of The Wall who takes part in no hackathon gives a name, an email and an institution only.
alter table hnh.person alter column study_level drop not null;

-- "Do you accept to be part of a mixed team?" null = never asked (registered before this question existed).
alter table hnh.person add column if not exists mixed_team_ok boolean;

alter table hnh.consent_event drop constraint if exists consent_event_kind_check;
alter table hnh.consent_event add constraint consent_event_kind_check
  check (kind in ('privacy','adult','cv_share','internship','photo_opt_out','agora_display','mixed_team'));

-- ---------------------------------------------------------------- The Wall
-- Names of the co-authors as the author typed them, shown under the post.
alter table hnh.agora_post add column if not exists coauthors text[] not null default '{}';
alter table hnh.agora_post drop constraint if exists agora_post_coauthors_check;
alter table hnh.agora_post add constraint agora_post_coauthors_check check (cardinality(coauthors) <= 4);

-- ---------------------------------------------------------------- calendar
-- Medical challenge published on Wednesday 25 November, medical registration until Friday 27 November
-- at 22:00, pitch in front of the jury on Saturday 5 December. Tunis time (UTC+1).
update hnh.time_window set opens_at = '2026-11-25 10:00+01', updated_at = now()
  where key = 'challenge_publish' and opens_at is distinct from '2026-11-25 10:00+01';
update hnh.time_window set closes_at = '2026-11-27 22:00+01', updated_at = now()
  where key = 'reg_medical' and closes_at is distinct from '2026-11-27 22:00+01';
update hnh.time_window set opens_at = '2026-12-05 08:00+01', updated_at = now()
  where key = 'jury_scoring' and opens_at is distinct from '2026-12-05 08:00+01';
