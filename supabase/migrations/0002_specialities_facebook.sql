-- Hack'n'Heal 2026 — 0002: Facebook field and multi-select specialities
--
-- Every statement is idempotent, so the file can be run again.
-- Order in production: run it, deploy the new code, then run it a second time.
-- The second run gives specialities to people registered by the old code in between
-- (their rows have a discipline and an empty specialities array).

alter table hnh.person
  add column if not exists facebook text,
  add column if not exists facebook_kind text check (facebook_kind in ('url', 'name')),
  add column if not exists specialities text[] not null default '{}'
    check (specialities <@ array['medecine','pharmacie','biologie','chimie','bioinformatique','dev','ai_data','autre']::text[]);

-- The app no longer writes discipline. The column and its values are kept until a later migration drops it.
alter table hnh.person alter column discipline drop not null;

update hnh.person
set specialities = array[case discipline
  when 'informatique' then 'dev'
  when 'data_ia' then 'ai_data'
  else discipline
end]
where specialities = '{}' and discipline is not null;

-- Same sides as SPECIALITIES in lib/constants.ts (profileKindOf in lib/teams.ts).
-- After changing a side there, run this statement again with the new lists.
update hnh.person
set profile_kind = case
  when 'bioinformatique' = any (specialities)
    or (specialities && array['medecine','pharmacie','biologie','chimie']
        and specialities && array['dev','ai_data']) then 'both'
  when specialities && array['medecine','pharmacie','biologie','chimie'] then 'health'
  when specialities && array['dev','ai_data'] then 'tech'
  else 'other'
end
where specialities <> '{}';
