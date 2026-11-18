import "server-only";
import { db } from "./db";

/**
 * Postgres-backed sliding window. Returns true when the action is allowed
 * (and records it), false when the limit is reached.
 */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number): Promise<boolean> {
  const sql = db();
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n from hnh.rate_event
    where bucket = ${bucket} and created_at > now() - make_interval(secs => ${windowSeconds})`;
  if (n >= limit) return false;
  await sql`insert into hnh.rate_event (bucket) values (${bucket})`;
  return true;
}
