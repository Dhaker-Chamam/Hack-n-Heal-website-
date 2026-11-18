"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/app/(public)/moi/actions";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/admin";
import { newToken, tokenHash } from "@/lib/crypto";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { confirmEmail, resendLinkEmail } from "@/lib/emails";
import type { Competition } from "@/lib/constants";
import { runMaintenance } from "@/lib/maintenance";
import { leaveTeam } from "@/lib/registration";
import { deleteCv, signedCvUrl } from "@/lib/storage";

const ok = (message: string): FormState => ({ ok: true, errors: {}, message });

export async function setStatus(personId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin");
  const status = String(form.get("status") ?? "");
  const reason = String(form.get("reason") ?? "").trim().slice(0, 300);
  if (!["confirmed", "cancelled", "rejected"].includes(status)) return { ok: false, errors: {}, message: "Statut invalide." };
  if (status !== "confirmed" && reason.length < 3) return { ok: false, errors: { reason: "Indique un motif." } };

  await db().begin(async (tx) => {
    await tx`
      update hnh.person set status = ${status}, status_reason = ${reason || null},
        email_confirmed_at = coalesce(email_confirmed_at, case when ${status} = 'confirmed' then now() end),
        updated_at = now()
      where id = ${personId}`;
    if (status !== "confirmed") {
      // free the seats
      const parts = await tx<{ id: string }[]>`
        select id from hnh.participation where person_id = ${personId} and team_id is not null`;
      for (const p of parts) await leaveTeam(tx, p.id, false);
    }
  });
  await audit("staff", staff.id, `person.${status}`, "person", personId, reason ? { reason } : undefined);
  revalidatePath(`/admin/inscriptions/${personId}`);
  return ok("Statut mis à jour.");
}

export async function resendLink(personId: string, _prev: FormState, _form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin");
  const token = newToken();
  const [p] = await db()<{ email: string; first_name: string; status: string }[]>`
    update hnh.person set access_token_hash = ${tokenHash(token)}, updated_at = now()
    where id = ${personId} returning email, first_name, status`;
  if (!p) return { ok: false, errors: {}, message: "Personne introuvable." };
  let mail;
  if (p.status === "pending") {
    const comps = await db()<{ competition: Competition }[]>`select competition from hnh.participation where person_id = ${personId}`;
    mail = { template: "confirm", ...confirmEmail(p.first_name, token, comps.map((c) => c.competition)) };
  } else {
    mail = { template: "resend_link", ...resendLinkEmail(p.first_name, token) };
  }
  after(() => sendMail({ personId, to: p.email, ...mail }));
  await audit("staff", staff.id, "person.resend_link", "person", personId);
  return ok("Nouveau lien envoyé.");
}

export async function openCv(personId: string): Promise<void> {
  const staff = await requireStaff("admin");
  const [p] = await db()<{ cv_path: string | null }[]>`select cv_path from hnh.person where id = ${personId}`;
  const url = p?.cv_path ? await signedCvUrl(p.cv_path) : null;
  if (!url) redirect(`/admin/inscriptions/${personId}?cv=absent`);
  await audit("staff", staff.id, "person.cv_view", "person", personId);
  redirect(url);
}

export async function deletePerson(personId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin");
  if (form.get("confirm") !== "on") return { ok: false, errors: { confirm: "Coche la case pour confirmer." } };
  const [p] = await db()<{ cv_path: string | null }[]>`delete from hnh.person where id = ${personId} returning cv_path`;
  if (p?.cv_path) await deleteCv(p.cv_path).catch(() => {});
  await audit("staff", staff.id, "person.delete", "person", personId);
  await runMaintenance(true).catch(() => {});
  redirect("/admin/inscriptions");
}
