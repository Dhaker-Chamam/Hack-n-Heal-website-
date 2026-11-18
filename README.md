# Hack'n'Heal 2026: participant site and back-office

The landing page (`/`, with four warm-up games), registration (solo or team, both competitions), personal space with QR code, team management, rules and privacy notice, and the organisers' back-office. French UI. Next.js 16 (App Router), Tailwind CSS 4, framer-motion on the landing page, Postgres (Supabase in production), Nodemailer over the club mailbox.

The landing page was designed in `hnh/` (English, standalone) and ported to `app/page.tsx` and `components/landing/` in French. `hnh/` is kept as the design reference and is not part of the build.

## Run it locally

```bash
npm install
cp .env.example .env.local      # then edit, see below
npm run db:local                # terminal 1: local Postgres on 127.0.0.1:54329, migrated on first run
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
- `npm test` runs the unit tests (team rules, deadlines, CSV).
- If styles look stale in `next dev` after editing `app/globals.css`, stop the server and delete `.next/`.

## Production setup

1. **Supabase**: project `ytrxmjssqdcxuorsmxyu` in organization "insat", region eu-west-1 (Ireland). Already set up on 16 Nov 2026: schema applied, `hnh_app` password set, private `cvs` bucket created; the values are in the git-ignored `.env.supabase.local`. For a new project, apply `supabase/migrations/0001_init.sql`. It creates schema `hnh` (not exposed to the REST API) and role `hnh_app` without login. Give that role a password out of band, never in git:
   `alter role hnh_app login password '<random>';`
   Then `DATABASE_URL=postgres://hnh_app.<project-ref>:<password>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require`.
2. **CV storage** (optional): create a private bucket `cvs` and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Without them, the CV field is hidden.
3. **Email**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` for the club mailbox (for Gmail: an app password, which needs 2-step verification).
4. **Vercel**: set every variable from `.env.example`, plus `CRON_SECRET` for the daily maintenance job (`vercel.json`, region `dub1`, next to the database).

## Rules enforced by the server

- Every write checks its time window (`hnh.time_window`, editable in `/admin/calendrier`) in the same transaction, using the database clock. A close at midnight is displayed as 23:59 the day before.
- Medical teams: 4 to 7 members; bioinformatics teams: 2 to 4; each needs a health and a tech profile (bioinformatics counts as either). Codes `MED-XXXX` / `BIO-XXXX`, never valid in the other competition.
- Unconfirmed registrations hold their team seat for 72 h, get a reminder after 24 h, and are deleted after 72 h.
- Personal links and staff sessions are 256-bit tokens stored only as hashes. IPs and devices are stored only as salted hashes.

## Not built yet

Agora (M2, Fri 20 Nov), challenge page, medical submission and Kaggle page (M3, Thu 26 Nov), games, check-in scanner, badges and jury (M4, Mon 30 Nov). Their public pages already exist as "opens on…" pages so the navigation never leads to a 404.

See `DESIGN.md` for the design system and `PRODUCT.md` for the product brief.
