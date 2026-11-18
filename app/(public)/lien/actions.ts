"use server";

import { after } from "next/server";
import { z } from "zod";
import { newToken, tokenHash } from "@/lib/crypto";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { confirmEmail, resendLinkEmail } from "@/lib/emails";
import type { Competition } from "@/lib/constants";
import { rateLimit } from "@/lib/ratelimit";
import { ipHash } from "@/lib/request";

export type LinkState = { sent: boolean; error?: string; message?: string };

export async function requestLink(_prev: LinkState, form: FormData): Promise<LinkState> {
  const parsed = z.email().trim().toLowerCase().max(160).safeParse(form.get("email"));
  if (!parsed.success) return { sent: false, error: "Adresse email invalide." };
  const email = parsed.data;

  const ip = await ipHash();
  if (!(await rateLimit(`link:ip:${ip}`, 10, 3600)) || !(await rateLimit(`link:email:${email}`, 3, 3600))) {
    return { sent: false, message: "Trop de demandes. Attends une heure avant de réessayer." };
  }

  const token = newToken();
  const [p] = await db()<{ id: string; first_name: string; status: string }[]>`
    update hnh.person set access_token_hash = ${tokenHash(token)}, updated_at = now()
    where lower(email) = ${email} and status in ('pending', 'confirmed') and anonymized_at is null
    returning id, first_name, status`;

  if (p) {
    let mail;
    if (p.status === "pending") {
      const comps = await db()<{ competition: Competition }[]>`
        select competition from hnh.participation where person_id = ${p.id}`;
      mail = { template: "confirm", ...confirmEmail(p.first_name, token, comps.map((c) => c.competition)) };
    } else {
      mail = { template: "resend_link", ...resendLinkEmail(p.first_name, token) };
    }
    after(() => sendMail({ personId: p.id, to: email, ...mail }));
  }
  // Same answer whether or not the address is registered.
  return { sent: true };
}
