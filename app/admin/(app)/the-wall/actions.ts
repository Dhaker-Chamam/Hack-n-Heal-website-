"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/app/(public)/moi/actions";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/admin";
import { db, UserError } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { wallChangesEmail, wallPublishedEmail, wallWinnerEmail } from "@/lib/emails";
import { rateLimit } from "@/lib/ratelimit";
import { formatDeadline } from "@/lib/time";
import { recountLikes } from "@/lib/wall-queries";
import { getWindow, hasClosed } from "@/lib/windows";

const fail = (message: string): FormState => ({ ok: false, errors: {}, message });
const done = (message: string): FormState => ({ ok: true, errors: {}, message });

const id = z.uuid("Action invalide.");
// generous: a moderator clears a whole queue in one sitting
const allowed = (staffId: string) => rateLimit(`admin-wall:${staffId}`, 600, 600);
const TOO_MANY = "Trop d'actions en peu de temps. Attends quelques minutes.";

function toState(e: unknown): FormState {
  if (e instanceof UserError) return fail(e.message);
  console.error("[admin the wall]", e);
  return fail("Une erreur technique est survenue. Réessaie dans un instant.");
}

function refresh() {
  revalidatePath("/admin/the-wall");
  revalidatePath("/the-wall");
}

const OPS = {
  approve: { status: "published", done: "Message publié." },
  changes: { status: "changes_requested", done: "Demande envoyée à l'auteur." },
  hide: { status: "hidden", done: "Message masqué." },
  remove: { status: "removed", done: "Message retiré." },
} as const;

/** Publish, send back for changes, hide or remove a post. Publishing also closes its open reports. */
export async function moderatePost(postId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin", "moderator");
  const parsed = z
    .object({
      post: id,
      op: z.enum(["approve", "changes", "hide", "remove"], { error: "Action invalide." }),
      reason: z.string().trim().max(500, "500 caractères maximum."),
    })
    .safeParse({ post: postId, op: form.get("op") ?? undefined, reason: String(form.get("reason") ?? "") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { post, op, reason } = parsed.data;
  if ((op === "changes" || op === "remove") && reason.length < 5) {
    return { ok: false, errors: { reason: op === "changes" ? "Écris ce que l'auteur doit corriger : il le reçoit par email." : "Indique le motif du retrait." } };
  }
  if (!(await allowed(staff.id))) return fail(TOO_MANY);

  let before: { published_at: Date | null; email: string; first_name: string; person_id: string; person_status: string };
  try {
    before = await db().begin(async (tx) => {
      const [row] = await tx<(typeof before)[]>`
        select p.published_at, a.email, a.first_name, a.id as person_id, a.status as person_status
        from hnh.agora_post p join hnh.person a on a.id = p.author_person_id
        where p.id = ${post} for update of p`;
      if (!row) throw new UserError("Ce message n'existe plus. Recharge la page.");
      if (op === "approve") {
        await tx`
          update hnh.agora_post
          set status = 'published', published_at = coalesce(published_at, now()), report_count = 0,
              moderation_reason = null, moderated_by = ${staff.id}, moderated_at = now()
          where id = ${post}`;
      } else {
        await tx`
          update hnh.agora_post
          set status = ${OPS[op].status}, moderation_reason = ${reason || null}, moderated_by = ${staff.id}, moderated_at = now()
          where id = ${post}`;
      }
      if (op === "approve" || op === "remove") {
        await tx`
          update hnh.agora_report set resolved_at = now(), resolved_by = ${staff.id}, resolution = ${op === "approve" ? "publié" : "retiré"}
          where post_id = ${post} and resolved_at is null`;
        if (op === "remove") await tx`update hnh.agora_post set report_count = 0 where id = ${post}`;
      }
      return row;
    });
  } catch (e) {
    return toState(e);
  }
  await audit("staff", staff.id, `wall.${op}`, "agora_post", post, reason ? { reason } : undefined);

  const author = before;
  if (author.person_status === "confirmed") {
    // the "published" email goes out once, the first time the post goes online
    if (op === "approve" && author.published_at === null) {
      const voting = await getWindow("agora_vote");
      const until = voting.closes_at ? formatDeadline(voting.closes_at) : "";
      after(() =>
        sendMail({ personId: author.person_id, to: author.email, template: "wall_published", ...wallPublishedEmail(author.first_name, post, until) }),
      );
    }
    if (op === "changes") {
      after(() => sendMail({ personId: author.person_id, to: author.email, template: "wall_changes", ...wallChangesEmail(author.first_name, reason) }));
    }
  }
  refresh();
  return done(OPS[op].done);
}

/** Stops, or allows again, an author's new posts and edits. Published posts are not touched. */
export async function setAuthorBlocked(personId: string, blocked: boolean, _prev: FormState, _form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin", "moderator");
  const parsed = z.object({ person: id, blocked: z.boolean() }).safeParse({ person: personId, blocked });
  if (!parsed.success) return fail("Action invalide.");
  if (!(await allowed(staff.id))) return fail(TOO_MANY);
  const [row] = await db()<{ id: string }[]>`
    update hnh.person set agora_blocked = ${parsed.data.blocked}, updated_at = now() where id = ${parsed.data.person} returning id`;
  if (!row) return fail("Personne introuvable.");
  await audit("staff", staff.id, parsed.data.blocked ? "wall.block_author" : "wall.unblock_author", "person", parsed.data.person);
  refresh();
  return done(parsed.data.blocked ? "Auteur suspendu : il ne peut plus publier." : "Auteur rétabli.");
}

/**
 * Vote review for one post: cancel the likes of one network, cancel or count the held likes.
 * Works after the vote has closed: that is when the organisers check the result.
 */
export async function reviewLikes(postId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin", "moderator");
  const parsed = z
    .object({
      post: id,
      op: z.enum(["void_ip", "void_held", "count_held"], { error: "Action invalide." }),
      ip: z.string().regex(/^[0-9a-f]{32}$/, "Action invalide.").optional(),
      reason: z.string().trim().max(300, "300 caractères maximum."),
    })
    .safeParse({ post: postId, op: form.get("op") ?? undefined, ip: form.get("ip") || undefined, reason: String(form.get("reason") ?? "") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { post, op, ip, reason } = parsed.data;
  if (op === "void_ip" && !ip) return fail("Action invalide.");
  if (op !== "count_held" && reason.length < 5) return { ok: false, errors: { reason: "Indique le motif de l'annulation : il est conservé." } };
  if (!(await allowed(staff.id))) return fail(TOO_MANY);

  let result: { changed: number; count: number };
  try {
    result = await db().begin(async (tx) => {
      const [row] = await tx`select 1 from hnh.agora_post where id = ${post} for update`;
      if (!row) throw new UserError("Ce message n'existe plus. Recharge la page.");
      const changed =
        op === "void_ip"
          ? await tx`update hnh.agora_like set status = 'void', void_reason = ${reason} where post_id = ${post} and ip_hash = ${ip!} and status <> 'void' returning 1`
          : op === "void_held"
            ? await tx`update hnh.agora_like set status = 'void', void_reason = ${reason} where post_id = ${post} and status = 'held' returning 1`
            : await tx`update hnh.agora_like set status = 'counted' where post_id = ${post} and status = 'held' returning 1`;
      return { changed: changed.length, count: await recountLikes(tx, post) };
    });
  } catch (e) {
    return toState(e);
  }
  await audit("staff", staff.id, `wall.likes_${op}`, "agora_post", post, { ...result, ...(ip ? { ip } : {}), ...(reason ? { reason } : {}) });
  refresh();
  const n = result.changed;
  const votes = `${n} vote${n > 1 ? "s" : ""}`;
  return done(`${votes} ${op === "count_held" ? (n > 1 ? "comptés" : "compté") : n > 1 ? "annulés" : "annulé"}. Total compté : ${result.count}.`);
}

/** Announces the winner once the vote has closed: banner on The Wall and an email to the author. Admins only. */
export async function confirmWinner(postId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin");
  const parsed = id.safeParse(postId);
  if (!parsed.success) return fail("Action invalide.");
  if (form.get("confirm") !== "on") return { ok: false, errors: { confirm: "Coche la case pour confirmer." } };
  if (!(await allowed(staff.id))) return fail(TOO_MANY);
  const voting = await getWindow("agora_vote");
  if (!hasClosed(voting)) return fail("Les votes ne sont pas encore clos.");

  const sql = db();
  const [author] = await sql<{ person_id: string; email: string; first_name: string; person_status: string }[]>`
    select a.id as person_id, a.email, a.first_name, a.status as person_status
    from hnh.agora_post p join hnh.person a on a.id = p.author_person_id
    where p.id = ${parsed.data} and p.status = 'published'`;
  if (!author) return fail("Ce message n'est pas en ligne.");
  await sql`
    insert into hnh.setting (key, value)
    values ('wall_winner', ${sql.json({ post_id: parsed.data, confirmed_by: staff.id, confirmed_at: new Date().toISOString() })})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  await audit("staff", staff.id, "wall.confirm_winner", "agora_post", parsed.data);
  if (author.person_status === "confirmed") {
    after(() => sendMail({ personId: author.person_id, to: author.email, template: "wall_winner", ...wallWinnerEmail(author.first_name, parsed.data) }));
  }
  refresh();
  return done("Gagnant confirmé : il est annoncé sur The Wall et prévenu par email.");
}
