"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { AGORA_CATEGORIES } from "@/lib/constants";
import { pseudo } from "@/lib/crypto";
import { db, UserError } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { assertWindow, recordConsents } from "@/lib/registration";
import { clientIp, deviceHash, ipHash } from "@/lib/request";
import { currentPerson, ensureVoterId, type Person } from "@/lib/session";
import {
  LIKES_PER_IP_HOUR,
  REPORT_REASONS,
  WALL_BODY_MAX,
  WALL_BODY_MIN,
  WALL_MAX_POSTS,
  WALL_POST_INTERVAL,
  WALL_REPORTS_TO_HIDE,
  likeStatus,
  textLength,
} from "@/lib/wall";
import { recountLikes } from "@/lib/wall-queries";
import type { FormState } from "../moi/actions";

const REQUIRED = "Ce champ est obligatoire.";
const POST_CLOSED = "Les publications sur The Wall sont closes.";

async function requireAuthor(): Promise<Person> {
  const person = await currentPerson();
  if (!person || person.status !== "confirmed") redirect("/lien?raison=session");
  return person;
}

function toState(e: unknown): FormState {
  if (e instanceof UserError) return { ok: false, errors: {}, message: e.message };
  console.error("[the wall]", e);
  return { ok: false, errors: {}, message: "Une erreur technique est survenue. Réessaie dans un instant." };
}

const postSchema = z.object({
  category: z.enum(Object.keys(AGORA_CATEGORIES) as [string, ...string[]], { error: "Choisis une catégorie." }),
  body: z
    .string({ error: REQUIRED })
    .transform((s) => s.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim())
    .refine((s) => textLength(s) >= WALL_BODY_MIN, `Écris au moins ${WALL_BODY_MIN} caractères.`)
    .refine((s) => textLength(s) <= WALL_BODY_MAX, `${WALL_BODY_MAX} caractères maximum.`),
  link_url: z.union([
    z.literal(""),
    z.url({ protocol: /^https$/, error: "Le lien doit commencer par https://" }).max(300, "Ce lien est trop long."),
  ]),
});

function parsePost(form: FormData) {
  const parsed = postSchema.safeParse({
    category: form.get("category") ?? undefined,
    body: form.get("body") ?? undefined,
    link_url: String(form.get("link_url") ?? "").trim(),
  });
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { data: parsed.success ? parsed.data : null, errors };
}

/** A new post: awaits moderation. At most WALL_MAX_POSTS per author, WALL_POST_INTERVAL minutes apart. */
export async function publishPost(_prev: FormState, form: FormData): Promise<FormState> {
  const person = await requireAuthor();
  const { data, errors } = parsePost(form);
  if (form.get("display") !== "on") errors.display = "Coche cette case pour publier.";
  if (!data || Object.keys(errors).length) return { ok: false, errors, message: "Certains champs sont à corriger." };
  if (!(await rateLimit(`wall:post:${person.id}`, 12, 3600))) {
    return { ok: false, errors: {}, message: "Trop de tentatives. Réessaie dans une heure." };
  }

  let postId: string;
  try {
    postId = await db().begin(async (tx) => {
      await assertWindow(tx, "agora_post", POST_CLOSED);
      // the person row is locked so two submissions at once cannot both pass the limits
      const [me] = await tx<{ agora_blocked: boolean }[]>`
        select agora_blocked from hnh.person where id = ${person.id} and status = 'confirmed' for update`;
      if (!me) throw new UserError("Ton inscription n'est plus active.");
      if (me.agora_blocked) throw new UserError("Les modérateurs ont suspendu tes publications sur The Wall. Écris aux organisateurs.");
      const [mine] = await tx<{ n: number; recent: boolean }[]>`
        select count(*)::int as n,
               coalesce(max(created_at) > now() - make_interval(mins => ${WALL_POST_INTERVAL}), false) as recent
        from hnh.agora_post where author_person_id = ${person.id}`;
      if (mine.n >= WALL_MAX_POSTS) throw new UserError(`Tu as déjà ${WALL_MAX_POSTS} messages, le maximum.`);
      if (mine.recent) throw new UserError(`Attends ${WALL_POST_INTERVAL} minutes entre deux messages.`);
      const [post] = await tx<{ id: string }[]>`
        insert into hnh.agora_post (author_person_id, category, body, link_url)
        values (${person.id}, ${data.category}, ${data.body}, ${data.link_url || null}) returning id`;
      await recordConsents(tx, person.id, [{ kind: "agora_display", granted: true }]);
      return post.id;
    });
  } catch (e) {
    return toState(e);
  }
  await audit("participant", person.id, "wall.post", "agora_post", postId);
  revalidatePath("/the-wall/publier");
  return { ok: true, errors: {}, message: "Message envoyé. Il apparaîtra sur The Wall après relecture par un modérateur." };
}

/** The author corrects a post that is not published yet; it goes back to the moderators. */
export async function updatePost(postId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const person = await requireAuthor();
  const id = z.uuid().safeParse(postId);
  const { data, errors } = parsePost(form);
  if (!id.success) return { ok: false, errors: {}, message: "Action invalide." };
  if (!data || Object.keys(errors).length) return { ok: false, errors, message: "Certains champs sont à corriger." };
  if (!(await rateLimit(`wall:post:${person.id}`, 12, 3600))) {
    return { ok: false, errors: {}, message: "Trop de tentatives. Réessaie dans une heure." };
  }

  try {
    await db().begin(async (tx) => {
      await assertWindow(tx, "agora_post", POST_CLOSED);
      const [post] = await tx<{ status: string; agora_blocked: boolean }[]>`
        select p.status, a.agora_blocked from hnh.agora_post p join hnh.person a on a.id = p.author_person_id
        where p.id = ${id.data} and p.author_person_id = ${person.id} for update of p`;
      if (!post) throw new UserError("Ce message n'existe plus.");
      if (post.agora_blocked) throw new UserError("Les modérateurs ont suspendu tes publications sur The Wall. Écris aux organisateurs.");
      if (post.status !== "pending" && post.status !== "changes_requested") {
        throw new UserError("Ce message ne peut plus être modifié.");
      }
      await tx`
        update hnh.agora_post
        set category = ${data.category}, body = ${data.body}, link_url = ${data.link_url || null},
            status = 'pending', moderation_reason = null
        where id = ${id.data}`;
    });
  } catch (e) {
    return toState(e);
  }
  await audit("participant", person.id, "wall.post_edit", "agora_post", id.data);
  revalidatePath("/the-wall/publier");
  return { ok: true, errors: {}, message: "Message renvoyé aux modérateurs." };
}

/** The author deletes one of their posts, with its likes. */
export async function deleteMyPost(postId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const person = await requireAuthor();
  const id = z.uuid().safeParse(postId);
  if (!id.success) return { ok: false, errors: {}, message: "Action invalide." };
  if (form.get("confirm") !== "on") return { ok: false, errors: { confirm: "Coche la case pour confirmer." } };
  const [gone] = await db()<{ id: string }[]>`
    delete from hnh.agora_post where id = ${id.data} and author_person_id = ${person.id} returning id`;
  if (!gone) return { ok: false, errors: {}, message: "Ce message n'existe plus." };
  await audit("participant", person.id, "wall.post_delete", "agora_post", id.data);
  revalidatePath("/the-wall/publier");
  revalidatePath("/the-wall");
  return { ok: true, errors: {}, message: "Message supprimé." };
}

export type LikeResult = { ok: true; liked: boolean; count: number } | { ok: false; message: string };

/**
 * Adds this browser's like to a post, or takes it back. No account: the voter is a signed cookie.
 * `hint` is the screen size and time zone, part of the device fingerprint used to hold suspect likes.
 */
export async function toggleLike(postId: string, hint: string): Promise<LikeResult> {
  const id = z.uuid().safeParse(postId);
  if (!id.success) return { ok: false, message: "Action invalide." };
  const voter = await ensureVoterId();
  const sql = db();
  const ip = await ipHash();
  const device = await deviceHash(String(hint ?? "").slice(0, 80));

  const [mine] = await sql`select 1 from hnh.agora_like where post_id = ${id.data} and voter_id = ${voter}`;
  // only new likes use the hourly allowance: taking a like back is always possible
  if (!mine && !(await rateLimit(`like:ip:${ip}`, LIKES_PER_IP_HOUR, 3600))) {
    return { ok: false, message: "Trop de votes depuis cette connexion. Réessaie dans une heure." };
  }

  try {
    return await sql.begin(async (tx) => {
      await assertWindow(tx, "agora_vote", "Les votes sont clos.");
      // the post row is locked: likes on one post are applied one at a time
      const [post] = await tx`select 1 from hnh.agora_post where id = ${id.data} and status = 'published' for update`;
      if (!post) throw new UserError("Ce message n'est plus en ligne.");
      const [like] = await tx<{ status: string }[]>`
        select status from hnh.agora_like where post_id = ${id.data} and voter_id = ${voter}`;
      let liked = true;
      if (like) {
        // a like cancelled by the organisers stays: deleting it would let this browser vote again
        if (like.status !== "void") {
          await tx`delete from hnh.agora_like where post_id = ${id.data} and voter_id = ${voter}`;
          liked = false;
        }
      } else {
        const [seen] = await tx<{ ip: number; device: number }[]>`
          select count(*) filter (where ip_hash = ${ip} and created_at > now() - interval '1 hour')::int as ip,
                 count(*) filter (where device_hash = ${device} and created_at > now() - interval '1 day')::int as device
          from hnh.agora_like where post_id = ${id.data}`;
        await tx`
          insert into hnh.agora_like (post_id, voter_id, ip_hash, device_hash, status)
          values (${id.data}, ${voter}, ${ip}, ${device}, ${likeStatus(seen.ip, seen.device)})`;
      }
      return { ok: true as const, liked, count: await recountLikes(tx, id.data) };
    });
  } catch (e) {
    if (e instanceof UserError) return { ok: false, message: e.message };
    console.error("[the wall] like", e);
    return { ok: false, message: "Le vote n'a pas été enregistré. Réessaie dans un instant." };
  }
}

/** Anyone can report a published post. WALL_REPORTS_TO_HIDE open reports hide it until a moderator reviews it. */
export async function reportPost(postId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({
      id: z.uuid("Action invalide."),
      reason: z.enum(Object.keys(REPORT_REASONS) as [string, ...string[]], { error: "Choisis un motif." }),
      details: z.string().trim().max(300, "300 caractères maximum."),
    })
    .safeParse({ id: postId, reason: form.get("reason") ?? undefined, details: String(form.get("details") ?? "") });
  if (!parsed.success) return { ok: false, errors: {}, message: parsed.error.issues[0].message };
  const v = parsed.data;
  // one report per post for a given network and browser, whatever cookies it holds
  const reporter = pseudo("reporter", `${await clientIp()}|${await deviceHash()}`);
  if (!(await rateLimit(`report:${reporter}`, 10, 3600))) {
    return { ok: false, errors: {}, message: "Trop de signalements. Réessaie dans une heure." };
  }

  let hidden = false;
  try {
    await db().begin(async (tx) => {
      const [post] = await tx`select 1 from hnh.agora_post where id = ${v.id} and status = 'published' for update`;
      if (!post) throw new UserError("Ce message n'est plus en ligne.");
      const [report] = await tx`
        insert into hnh.agora_report (post_id, reason, details, reporter_hash)
        values (${v.id}, ${v.reason}, ${v.details || null}, ${reporter})
        on conflict (post_id, reporter_hash) do nothing returning id`;
      if (!report) return;
      const [counted] = await tx<{ report_count: number }[]>`
        update hnh.agora_post set report_count = report_count + 1 where id = ${v.id} returning report_count`;
      if (counted.report_count >= WALL_REPORTS_TO_HIDE) {
        await tx`
          update hnh.agora_post set status = 'hidden', moderation_reason = 'Masqué automatiquement après signalements'
          where id = ${v.id}`;
        hidden = true;
      }
    });
  } catch (e) {
    return toState(e);
  }
  // no revalidatePath: the page would reload without the post and lose this answer
  if (hidden) await audit("system", null, "wall.post_auto_hidden", "agora_post", v.id);
  return { ok: true, errors: {}, message: "Merci. Un modérateur va relire ce message." };
}
