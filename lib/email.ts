import "server-only";
import nodemailer from "nodemailer";
import { db } from "./db";
import { env } from "./env";
import { qrPayload, qrPng } from "./qr";

type Mail = {
  personId?: string | null;
  to: string;
  template: string;
  subject: string;
  html: string;
  text: string;
  /** attach the person's check-in QR code as an inline image (cid:qr) */
  withQr?: boolean;
};

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function transport() {
  if (!env.smtp.host) return null;
  transporter ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

/**
 * Stores the message in the outbox, then tries to send it.
 * Bodies of sent messages are wiped afterwards: they can contain personal links.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const sql = db();
  const [row] = await sql<{ id: number }[]>`
    insert into hnh.email_outbox (person_id, to_email, template, subject, html, text_body)
    values (${mail.personId ?? null}, ${mail.to}, ${mail.template}, ${mail.subject}, ${mail.html}, ${mail.text})
    returning id`;
  return deliver(row.id, mail);
}

/** Re-sends a failed or skipped message whose body is still stored. */
export async function retryMail(id: number): Promise<boolean> {
  const [m] = await db()<
    { person_id: string | null; to_email: string; template: string; subject: string; html: string; text_body: string }[]
  >`
    select person_id, to_email, template, subject, html, text_body from hnh.email_outbox
    where id = ${id} and status in ('failed', 'skipped') and html <> ''`;
  if (!m) return false;
  return deliver(id, {
    personId: m.person_id,
    to: m.to_email,
    template: m.template,
    subject: m.subject,
    html: m.html,
    text: m.text_body,
    withQr: m.template === "welcome",
  });
}

async function deliver(id: number, mail: Mail): Promise<boolean> {
  const sql = db();
  const t = transport();
  if (!t) {
    // Development without SMTP: keep the body so it can be read in /admin/emails.
    await sql`update hnh.email_outbox set status = 'skipped', attempts = attempts + 1 where id = ${id}`;
    console.info(`[mail:skipped] to=${mail.to} subject="${mail.subject}"\n${mail.text}\n`);
    return true;
  }
  try {
    await t.sendMail({
      from: env.mailFrom,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments:
        mail.withQr && mail.personId
          ? [{ filename: "qr-hacknheal.png", content: await qrPng(qrPayload(mail.personId)), cid: "qr" }]
          : [],
    });
    await sql`
      update hnh.email_outbox
      set status = 'sent', attempts = attempts + 1, sent_at = now(), html = '', text_body = ''
      where id = ${id}`;
    return true;
  } catch (e) {
    await sql`
      update hnh.email_outbox
      set status = 'failed', attempts = attempts + 1, last_error = ${String(e).slice(0, 500)}
      where id = ${id}`;
    console.error("[mail:failed]", e);
    return false;
  }
}
