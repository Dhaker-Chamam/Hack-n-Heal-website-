"use server";

import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { newToken, tokenHash } from "@/lib/crypto";
import { db } from "@/lib/db";
import { setStaffCookie } from "@/lib/session";

/** Consumes a one-time staff login link and opens a 14-day session. */
export async function consumeStaffLogin(token: string) {
  const [login] = await db()<{ staff_id: string }[]>`
    update hnh.staff_login set used_at = now()
    where token_hash = ${tokenHash(token)} and used_at is null and expires_at > now()
    returning staff_id`;
  if (!login) redirect("/admin/connexion?raison=expire");
  const session = newToken();
  await db()`
    insert into hnh.staff_session (token_hash, staff_id, expires_at)
    values (${tokenHash(session)}, ${login.staff_id}, now() + interval '14 days')`;
  await setStaffCookie(session);
  await audit("staff", login.staff_id, "staff.login");
  redirect("/admin");
}
