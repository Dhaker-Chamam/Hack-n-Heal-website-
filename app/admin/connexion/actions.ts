"use server";

import { after } from "next/server";
import { z } from "zod";
import { newToken, tokenHash } from "@/lib/crypto";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { staffLoginEmail } from "@/lib/emails";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/ratelimit";
import { ipHash } from "@/lib/request";

export type StaffLoginState = { sent: boolean; error?: string };

export async function requestStaffLink(_prev: StaffLoginState, form: FormData): Promise<StaffLoginState> {
  const parsed = z.email().trim().toLowerCase().safeParse(form.get("email"));
  if (!parsed.success) return { sent: false, error: "Adresse email invalide." };
  const email = parsed.data;
  if (!(await rateLimit(`staff:ip:${await ipHash()}`, 10, 3600)) || !(await rateLimit(`staff:email:${email}`, 5, 3600))) {
    return { sent: false, error: "Trop de demandes. Réessaie dans une heure." };
  }

  // Bootstrap: addresses listed in ADMIN_EMAILS become admins on first login request.
  if (env.adminEmails.includes(email)) {
    await db()`
      insert into hnh.staff (email, display_name, role)
      select ${email}, ${email.split("@")[0]}, 'admin'
      where not exists (select 1 from hnh.staff where lower(email) = ${email})`;
  }

  const [staff] = await db()<{ id: string; display_name: string }[]>`
    select id, display_name from hnh.staff where lower(email) = ${email} and active`;
  if (staff) {
    const token = newToken();
    await db()`
      insert into hnh.staff_login (token_hash, staff_id, expires_at)
      values (${tokenHash(token)}, ${staff.id}, now() + interval '20 minutes')`;
    after(() => sendMail({ to: email, template: "staff_login", ...staffLoginEmail(staff.display_name, token) }));
  }
  return { sent: true };
}
