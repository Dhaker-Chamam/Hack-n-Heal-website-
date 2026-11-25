-- Hack'n'Heal 2026 — schema "hnh"
-- The schema is not exposed through the Supabase REST API. The app reaches it
-- server-side as role "hnh_app" (created out of band with a password).

create schema if not exists hnh;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'hnh_app') then
    create role hnh_app nologin;
  end if;
end $$;

revoke all on schema hnh from public;
grant usage on schema hnh to hnh_app;

-- ---------------------------------------------------------------- windows
create table hnh.time_window (
  key text primary key,
  label text not null,
  opens_at timestamptz,
  closes_at timestamptz,            -- exclusive end
  manual_state text not null default 'auto' check (manual_state in ('auto','open','closed')),
  updated_at timestamptz not null default now()
);

create or replace function hnh.window_is_open(k text)
returns boolean language sql stable set search_path = '' as $$
  select coalesce((
    select case w.manual_state
      when 'open' then true
      when 'closed' then false
      else (w.opens_at is null or now() >= w.opens_at)
       and (w.closes_at is null or now() < w.closes_at)
    end
    from hnh.time_window w where w.key = k
  ), false)
$$;

insert into hnh.time_window (key, label, opens_at, closes_at, manual_state) values
  ('reg_medical',      'Inscriptions — hackathon médical',          null, '2026-11-27 00:00+01', 'auto'),
  ('teams_medical',    'Équipes médicales modifiables',             null, '2026-11-28 00:00+01', 'auto'),
  ('reg_bioinfo',      'Inscriptions et équipes — bioinformatique', null, '2026-12-03 00:00+01', 'auto'),
  ('challenge_publish','Publication du défi médical',               '2026-11-28 10:00+01', null, 'auto'),
  ('submit_medical',   'Dépôt des projets médicaux',                '2026-11-28 10:00+01', '2026-12-04 00:00+01', 'auto'),
  ('agora_post',       'Publication sur The Wall',                  '2026-11-20 00:00+01', '2026-12-03 00:00+01', 'auto'),
  ('agora_vote',       'Votes sur The Wall',                        '2026-11-20 00:00+01', '2026-12-03 20:00+01', 'auto'),
  ('games',            'Mini-jeux (classement)',                    '2026-11-30 00:00+01', '2026-12-06 12:00+01', 'auto'),
  ('bioinfo_reveal',   'Lien Kaggle dévoilé',                       null, null, 'closed'),
  ('checkin',          'Accueil et enregistrement',                 '2026-12-05 07:00+01', '2026-12-06 18:00+01', 'auto'),
  ('jury_scoring',     'Notation du jury',                          '2026-12-06 08:00+01', null, 'auto');

create table hnh.setting (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- people
create table hnh.person (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  institution text not null,
  study_level text not null,
  discipline text not null check (discipline in
    ('medecine','pharmacie','biologie','bioinformatique','informatique','data_ia','autre')),
  profile_kind text not null check (profile_kind in ('health','tech','both','other')),
  skills text[] not null default '{}',
  link_url text,
  photo_opt_out boolean not null default false,
  internship_offers_opt_in boolean not null default false,
  cv_path text,
  cv_uploaded_at timestamptz,
  cv_share_opt_in boolean not null default false,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','rejected')),
  status_reason text,
  email_confirmed_at timestamptz,
  access_token_hash text not null unique,
  participant_code text not null unique,
  agora_blocked boolean not null default false,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  anonymized_at timestamptz
);
create unique index person_email_uq on hnh.person (lower(email));
create index person_status_idx on hnh.person (status);

create table hnh.team (
  id uuid primary key default gen_random_uuid(),
  competition text not null check (competition in ('medical','bioinfo')),
  name text not null,
  join_code text not null unique,
  lead_participation_id uuid,
  locked_at timestamptz,
  panel text,
  pitch_slot int,
  mentor_id uuid,
  admin_note text,
  created_at timestamptz not null default now()
);
create unique index team_name_uq on hnh.team (competition, lower(name));

create table hnh.participation (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references hnh.person(id) on delete cascade,
  competition text not null check (competition in ('medical','bioinfo')),
  team_id uuid references hnh.team(id) on delete set null,
  seeking_team boolean not null default false,
  seeking_note text,
  kaggle_username text,
  has_laptop boolean,
  status text not null default 'active' check (status in ('active','withdrawn')),
  joined_team_at timestamptz,
  created_at timestamptz not null default now(),
  unique (person_id, competition)
);
create index participation_team_idx on hnh.participation (team_id);

alter table hnh.team
  add constraint team_lead_fk foreign key (lead_participation_id)
  references hnh.participation(id) on delete set null;

create table hnh.consent_event (
  id bigserial primary key,
  person_id uuid not null references hnh.person(id) on delete cascade,
  kind text not null check (kind in ('privacy','adult','cv_share','internship','photo_opt_out','agora_display')),
  granted boolean not null,
  text_version text not null,
  created_at timestamptz not null default now()
);
create index consent_person_idx on hnh.consent_event (person_id);

-- ---------------------------------------------------------------- staff, sponsors, guests
create table hnh.staff (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null,
  role text not null check (role in ('admin','moderator','checkin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index staff_email_uq on hnh.staff (lower(email));

create table hnh.staff_login (
  token_hash text primary key,
  staff_id uuid not null references hnh.staff(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table hnh.staff_session (
  token_hash text primary key,
  staff_id uuid not null references hnh.staff(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table hnh.sponsor (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null check (tier in ('bronze','silver','gold','official')),
  logo_url text,
  website text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table hnh.mentor (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  sponsor_id uuid references hnh.sponsor(id) on delete set null,
  access_token_hash text not null unique,
  created_at timestamptz not null default now()
);
alter table hnh.team
  add constraint team_mentor_fk foreign key (mentor_id) references hnh.mentor(id) on delete set null;

create table hnh.juror (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  organization text,
  sponsor_id uuid references hnh.sponsor(id) on delete set null,
  panel text,
  access_token_hash text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- challenge, submissions, jury
create table hnh.challenge (
  competition text primary key check (competition in ('medical')),
  title text not null default '',
  body_md text not null default '',
  resources jsonb not null default '[]',
  co_author_sponsor_id uuid references hnh.sponsor(id) on delete set null,
  announced_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into hnh.challenge (competition) values ('medical');

create table hnh.submission (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references hnh.team(id) on delete cascade,
  title text not null,
  summary text not null,
  axis text not null check (axis in ('cancer','diabete','autre_auto_immune')),
  video_url text not null,
  repo_url text,
  slides_url text,
  data_sources text not null,
  no_patient_data_ack boolean not null check (no_patient_data_ack),
  submitted_by uuid references hnh.participation(id) on delete set null,
  reopened_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hnh.submission_version (
  id bigserial primary key,
  submission_id uuid not null references hnh.submission(id) on delete cascade,
  data jsonb not null,
  saved_by uuid references hnh.participation(id) on delete set null,
  saved_at timestamptz not null default now()
);

create table hnh.criterion (
  id uuid primary key default gen_random_uuid(),
  competition text not null default 'medical',
  label text not null,
  description text not null default '',
  weight numeric not null check (weight > 0),
  sort int not null default 0
);
insert into hnh.criterion (label, description, weight, sort) values
  ('Pertinence médicale', 'Le besoin patient ou clinique est réel, précis et bien compris.', 25, 1),
  ('Qualité du prototype', 'Ce qui est montré fonctionne ; la faisabilité technique est crédible.', 25, 2),
  ('Innovation', 'L''approche apporte quelque chose de neuf par rapport à l''existant.', 20, 3),
  ('Données et éthique', 'Sources citées, données utilisées de façon responsable, limites reconnues.', 15, 4),
  ('Pitch et vidéo', 'Clarté, rythme, réponses aux questions du jury.', 15, 5);

create table hnh.score (
  juror_id uuid not null references hnh.juror(id) on delete cascade,
  team_id uuid not null references hnh.team(id) on delete cascade,
  criterion_id uuid not null references hnh.criterion(id) on delete cascade,
  value int not null check (value between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (juror_id, team_id, criterion_id)
);

create table hnh.juror_review (
  juror_id uuid not null references hnh.juror(id) on delete cascade,
  team_id uuid not null references hnh.team(id) on delete cascade,
  comment text,
  finalized_at timestamptz,
  primary key (juror_id, team_id)
);

create table hnh.kaggle_result (
  id bigserial primary key,
  team_id uuid references hnh.team(id) on delete set null,
  kaggle_team_name text not null,
  private_score numeric,
  rank int not null,
  imported_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- Agora
create table hnh.agora_post (
  id uuid primary key default gen_random_uuid(),
  author_person_id uuid not null references hnh.person(id) on delete cascade,
  category text not null check (category in ('projet','idee','reflexion')),
  body text not null check (char_length(body) between 20 and 800),
  link_url text,
  status text not null default 'pending'
    check (status in ('pending','published','changes_requested','hidden','removed')),
  counted_likes int not null default 0,
  last_counted_like_at timestamptz,
  report_count int not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  moderated_by uuid references hnh.staff(id) on delete set null,
  moderated_at timestamptz,
  moderation_reason text
);
create index agora_post_status_idx on hnh.agora_post (status, published_at desc);

create table hnh.agora_like (
  id bigserial primary key,
  post_id uuid not null references hnh.agora_post(id) on delete cascade,
  voter_id uuid not null,
  ip_hash text not null,
  device_hash text not null,
  status text not null check (status in ('counted','held','void')),
  void_reason text,
  created_at timestamptz not null default now(),
  unique (post_id, voter_id)
);
create index agora_like_ip_idx on hnh.agora_like (ip_hash, created_at);
create index agora_like_post_idx on hnh.agora_like (post_id, created_at);

create table hnh.agora_report (
  id bigserial primary key,
  post_id uuid not null references hnh.agora_post(id) on delete cascade,
  reason text not null check (reason in ('donnees_patient','desinformation','offensant','spam')),
  details text,
  reporter_hash text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references hnh.staff(id) on delete set null,
  resolution text,
  unique (post_id, reporter_hash)
);

-- ---------------------------------------------------------------- games
create table hnh.game_session (
  id uuid primary key default gen_random_uuid(),
  game text not null check (game in ('codons','glycemie','depistage')),
  seed bigint not null,
  nickname text,
  person_id uuid references hnh.person(id) on delete set null,
  device_hash text not null,
  ip_hash text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  actions jsonb,
  score int,
  verdict text not null default 'pending' check (verdict in ('pending','valid','rejected')),
  reject_reason text
);
create index game_board_idx on hnh.game_session (game, verdict, score desc);

-- ---------------------------------------------------------------- check-in, email, audit, rate limits
create table hnh.checkin (
  id bigserial primary key,
  person_id uuid not null references hnh.person(id) on delete cascade,
  day date not null,
  scanned_at timestamptz not null,
  synced_at timestamptz not null default now(),
  scanned_by uuid references hnh.staff(id) on delete set null,
  source text not null check (source in ('qr','manual')),
  unique (person_id, day)
);

create table hnh.email_outbox (
  id bigserial primary key,
  person_id uuid references hnh.person(id) on delete set null,
  to_email text not null,
  template text not null,
  subject text not null,
  html text not null,
  text_body text not null,
  status text not null default 'queued' check (status in ('queued','sent','failed','skipped')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index email_outbox_status_idx on hnh.email_outbox (status, created_at);

create table hnh.audit_log (
  id bigserial primary key,
  actor_type text not null,
  actor_id text,
  action text not null,
  entity text,
  entity_id text,
  data jsonb,
  at timestamptz not null default now()
);

create table hnh.rate_event (
  id bigserial primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);
create index rate_event_idx on hnh.rate_event (bucket, created_at);

-- ---------------------------------------------------------------- privileges and RLS
grant select, insert, update, delete on all tables in schema hnh to hnh_app;
grant usage, select on all sequences in schema hnh to hnh_app;
grant execute on all functions in schema hnh to hnh_app;
-- Tables, sequences and functions added by later migrations (run as the same owner) get the same grants.
-- Each new table still needs RLS enabled and its own app_all policy.
alter default privileges in schema hnh grant select, insert, update, delete on tables to hnh_app;
alter default privileges in schema hnh grant usage, select on sequences to hnh_app;
alter default privileges in schema hnh grant execute on functions to hnh_app;

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'hnh' loop
    execute format('alter table hnh.%I enable row level security', t.tablename);
    execute format('create policy app_all on hnh.%I for all to hnh_app using (true) with check (true)', t.tablename);
  end loop;
end $$;
