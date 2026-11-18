import "server-only";
import { db } from "./db";
import { sendMail } from "./email";
import { reminderEmail } from "./emails";
import { deleteCv } from "./storage";

let lastRun = 0;

/**
 * Housekeeping, run opportunistically after registrations and by the daily cron:
 * - reminder 24 h after an unconfirmed registration,
 * - deletion of unconfirmed registrations after 72 h (data minimisation),
 * - deletion of empty teams and re-assignment of team leads,
 * - purge of rate-limit events older than 2 days.
 */
export async function runMaintenance(force = false) {
  if (!force && Date.now() - lastRun < 10 * 60_000) return;
  lastRun = Date.now();
  const sql = db();

  const toRemind = await sql<{ id: string; email: string; first_name: string }[]>`
    update hnh.person set reminder_sent_at = now()
    where status = 'pending' and reminder_sent_at is null
      and created_at < now() - interval '24 hours' and created_at > now() - interval '72 hours'
    returning id, email, first_name`;
  for (const p of toRemind) {
    await sendMail({ personId: p.id, to: p.email, template: "reminder", ...reminderEmail(p.first_name) });
  }

  const expired = await sql<{ cv_path: string | null }[]>`
    delete from hnh.person
    where status = 'pending' and created_at < now() - interval '72 hours'
    returning cv_path`;
  for (const e of expired) if (e.cv_path) await deleteCv(e.cv_path).catch(() => {});

  // Lead left or expired: the earliest remaining member becomes lead
  await sql`
    update hnh.team t set lead_participation_id = (
      select pa.id from hnh.participation pa
      where pa.team_id = t.id and pa.status = 'active'
      order by pa.joined_team_at nulls last, pa.created_at limit 1)
    where t.lead_participation_id is null
       or not exists (select 1 from hnh.participation pa
                      where pa.id = t.lead_participation_id and pa.team_id = t.id and pa.status = 'active')`;

  await sql`
    delete from hnh.team t
    where t.locked_at is null
      and not exists (select 1 from hnh.participation pa where pa.team_id = t.id and pa.status = 'active')
      and not exists (select 1 from hnh.submission s where s.team_id = t.id)`;

  await sql`delete from hnh.rate_event where created_at < now() - interval '2 days'`;
}
