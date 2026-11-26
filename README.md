# Hack'n'Heal 2026: participant site and back-office

Official website for Hack'n'Heal — the health-tech hackathon bringing developers, designers, and innovators together to build solutions for a healthier future.

The landing page (`/`, with five warm-up games, also playable on `/jeux`), registration (solo or team, both competitions), personal space with QR code, team management, rules and privacy notice, and the organisers' back-office. French UI. Next.js 16 (App Router), Tailwind CSS 4, framer-motion on the landing page, Postgres (Supabase in production), Nodemailer over the club mailbox.

The landing page was designed in `hnh/` (English, standalone) and ported to `app/page.tsx` and `components/landing/` in French. `hnh/` is kept as the design reference and is not part of the build.

## Run it locally

```bash
npm install
cp .env.example .env.local      # then edit, see below
npm run db:local                # terminal 1: local Postgres on 127.0.0.1:54329, applies the migrations not yet run
npm run dev                     # terminal 2: http://localhost:3000
```

Minimal `.env.local` for local work:

```
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54329/postgres
DATABASE_POOL_MAX=1
APP_SECRET=<32+ random characters>
HASH_SALT=<random characters>
APP_URL=http://localhost:3000
ADMIN_EMAILS=you@example.org
```

Without `SMTP_HOST`, emails are not sent: they are stored in the outbox and printed in the dev server console, and an admin can read them at `/admin/emails`. That is how you get the confirmation link and the staff login link in development.

- Organiser login: `/admin/connexion` with an address listed in `ADMIN_EMAILS` (it becomes an admin on first request).
- `npm run db:local -- reset` wipes the local database.
- `npm test` runs the unit tests (team rules, deadlines, CSV, Facebook links, radar data, the rules and emails of The Wall, migrations 0002 and 0003 on a database with old rows).
- If styles look stale in `next dev` after editing `app/globals.css`, stop the server and delete `.next/`.

## Production setup

1. **Supabase**: project `ytrxmjssqdcxuorsmxyu` in organization "insat", region eu-west-1 (Ireland). Already set up on 16 Nov 2026: schema applied, `hnh_app` password set, private `cvs` bucket created; the values are in the git-ignored `.env.supabase.local`. For a new project, apply the files in `supabase/migrations/` in order. `0002` is safe to run again: on a live database, run it, deploy, then run it once more (it gives specialities to people registered by the old code in between). `0003` also sets three calendar dates, so run it once only: a later run would undo a date changed since in `/admin/calendrier`. The first file creates schema `hnh` (not exposed to the REST API) and role `hnh_app` without login. Give that role a password out of band, never in git:
   `alter role hnh_app login password '<random>';`
   Then `DATABASE_URL=postgres://hnh_app.<project-ref>:<password>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require`.
2. **CV storage** (optional): create a private bucket `cvs` and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Without them, the CV field is hidden.
3. **Email**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` for the club mailbox (for Gmail: an app password, which needs 2-step verification).
4. **Vercel**: set every variable from `.env.example`, plus `CRON_SECRET` for the daily maintenance job (`vercel.json`, region `dub1`, next to the database). The project is connected to this GitHub repository: every push to `main` deploys to production. Run a new file from `supabase/migrations/` on Supabase before pushing the code that needs it. The variables exist for production only, so preview deployments of other branches build but have no database.

## Rules enforced by the server

- Every write checks its time window (`hnh.time_window`, editable in `/admin/calendrier`) in the same transaction, using the database clock. A close at midnight is displayed as 23:59 the day before.
- Medical teams: 4 to 7 members; bioinformatics teams: 2 to 4; each needs a health and a tech profile. A person's side comes from their speciality tags (1 to 4, listed with their sides in `lib/constants.ts`); someone on both sides counts for whichever is missing, but not for both alone. Codes `MED-XXXX` / `BIO-XXXX`, never valid in the other competition.
- Unconfirmed registrations hold their team seat for 72 h, get a reminder after 24 h, and are deleted after 72 h.
- Organisers build and fix teams at `/admin/equipes` (admins and moderators). Those actions ignore the time windows but refuse a locked team until it is unlocked.
- Personal links and staff sessions are 256-bit tokens stored only as hashes. IPs and devices are stored only as salted hashes.

## Not built yet

Challenge page, medical submission and Kaggle page (M3, due before Sat 28 Nov 10:00), games, check-in scanner, badges and jury (M4, Mon 30 Nov). Their public pages already exist as "opens on…" pages so the navigation never leads to a 404.

## The Wall

Built on 25 Nov, opened on 26 Nov to people who take part in no hackathon: they give a name, an email and an institution at `/the-wall/publier`, confirm with the emailed link, and exist as a person with no participation (no QR code, no team). Every confirmed person writes up to 3 posts at `/the-wall/publier`, each with up to 4 co-author names shown as typed; nothing is public until a moderator approves it at `/admin/the-wall` (admins and moderators; the dashboard shows how many are waiting). Anyone can like without an account: one like per post per browser, a signed cookie. Likes beyond 5 an hour from one network on one post, or 3 a day from one device, are held and not counted until a moderator counts or cancels them in the "Votes" tab. Three reports hide a post until it is reviewed. When the vote window closes the page turns into the ranking, and an admin confirms the winner from the "Votes" tab. The limits are in `lib/wall.ts`. Cloudflare Turnstile is not wired in.

See `DESIGN.md` for the design system and `PRODUCT.md` for the product brief.
