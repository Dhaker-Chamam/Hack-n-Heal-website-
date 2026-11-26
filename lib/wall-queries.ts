import "server-only";
import type postgres from "postgres";
import type { AGORA_CATEGORIES } from "./constants";
import { db } from "./db";
import type { PostStatus, ReportReason } from "./wall";

export type WallCategory = keyof typeof AGORA_CATEGORIES;
export type WallSort = "recents" | "populaires";

/** A published post as the public sees it. The last name is only used for its initial. */
export type WallPost = {
  id: string;
  category: WallCategory;
  body: string;
  link_url: string | null;
  coauthors: string[];
  counted_likes: number;
  published_at: Date;
  first_name: string;
  last_name: string;
  institution: string;
  liked: boolean;
};

export const WALL_PAGE = 30;

/**
 * Published posts. "populaires" is also the ranking: most counted likes first,
 * and between equals the post that reached its total first.
 * Returns one row more than a page holds when there is a next page.
 */
export async function listWallPosts(sort: WallSort, page: number, voter: string | null): Promise<WallPost[]> {
  const sql = db();
  const order =
    sort === "populaires"
      ? sql`p.counted_likes desc, p.last_counted_like_at asc nulls last, p.published_at asc`
      : sql`p.published_at desc`;
  return sql<WallPost[]>`
    select p.id, p.category, p.body, p.link_url, p.coauthors, p.counted_likes, p.published_at,
           a.first_name, a.last_name, a.institution, (l.id is not null) as liked
    from hnh.agora_post p
    join hnh.person a on a.id = p.author_person_id
    left join hnh.agora_like l on l.post_id = p.id and l.voter_id = ${voter}::uuid
    where p.status = 'published'
    order by ${order}
    limit ${WALL_PAGE + 1} offset ${(page - 1) * WALL_PAGE}`;
}

export async function getWallPost(id: string, voter: string | null): Promise<WallPost | null> {
  const [post] = await db()<WallPost[]>`
    select p.id, p.category, p.body, p.link_url, p.coauthors, p.counted_likes, p.published_at,
           a.first_name, a.last_name, a.institution, (l.id is not null) as liked
    from hnh.agora_post p
    join hnh.person a on a.id = p.author_person_id
    left join hnh.agora_like l on l.post_id = p.id and l.voter_id = ${voter}::uuid
    where p.id = ${id} and p.status = 'published'`;
  return post ?? null;
}

export type MyWallPost = {
  id: string;
  category: WallCategory;
  body: string;
  link_url: string | null;
  coauthors: string[];
  status: PostStatus;
  moderation_reason: string | null;
  counted_likes: number;
  created_at: Date;
};

export async function myWallPosts(personId: string): Promise<MyWallPost[]> {
  return db()<MyWallPost[]>`
    select id, category, body, link_url, coauthors, status, moderation_reason, counted_likes, created_at
    from hnh.agora_post where author_person_id = ${personId} order by created_at desc`;
}

/** The post the organisers confirmed as the winner, once they have. */
export async function wallWinner(): Promise<string | null> {
  const [row] = await db()<{ value: { post_id?: string } }[]>`select value from hnh.setting where key = 'wall_winner'`;
  return row?.value?.post_id ?? null;
}

// ------------------------------------------------------------------ back-office

export type WallQueue = { pending: number; reported: number; published: number; total: number };

export async function wallQueue(): Promise<WallQueue> {
  const [row] = await db()<WallQueue[]>`
    select count(*) filter (where status = 'pending')::int as pending,
           count(*) filter (where report_count > 0 or status = 'hidden')::int as reported,
           count(*) filter (where status = 'published')::int as published,
           count(*)::int as total
    from hnh.agora_post`;
  return row;
}

export type ModerationView = "attente" | "signalements" | "publies" | "tous";

export type ModerationPost = {
  id: string;
  category: WallCategory;
  body: string;
  link_url: string | null;
  coauthors: string[];
  status: PostStatus;
  moderation_reason: string | null;
  counted_likes: number;
  report_count: number;
  created_at: Date;
  published_at: Date | null;
  author_person_id: string;
  first_name: string;
  last_name: string;
  email: string;
  institution: string;
  agora_blocked: boolean;
  /** reports not reviewed yet */
  reports: { reason: ReportReason; details: string | null }[];
};

export async function moderationPosts(view: ModerationView): Promise<ModerationPost[]> {
  const sql = db();
  const filter = {
    attente: sql`p.status = 'pending'`,
    signalements: sql`(p.report_count > 0 or p.status = 'hidden')`,
    publies: sql`p.status = 'published'`,
    tous: sql`true`,
  }[view];
  // the queue is read oldest first, the other lists newest first
  const order = view === "attente" ? sql`p.created_at asc` : sql`p.created_at desc`;
  return sql<ModerationPost[]>`
    select p.id, p.category, p.body, p.link_url, p.coauthors, p.status, p.moderation_reason, p.counted_likes, p.report_count,
           p.created_at, p.published_at, p.author_person_id,
           a.first_name, a.last_name, a.email, a.institution, a.agora_blocked,
           coalesce((select json_agg(json_build_object('reason', r.reason, 'details', r.details) order by r.created_at)
                     from hnh.agora_report r where r.post_id = p.id and r.resolved_at is null), '[]'::json) as reports
    from hnh.agora_post p join hnh.person a on a.id = p.author_person_id
    where ${filter}
    order by ${order}
    limit 200`;
}

export type LikeAudit = {
  id: string;
  excerpt: string;
  status: PostStatus;
  first_name: string;
  last_name: string;
  institution: string;
  counted: number;
  held: number;
  voided: number;
  total: number;
  /** likes of any status in the last 10 minutes */
  last10: number;
  /** likes not voided coming from the single most frequent network */
  top_ip: number;
};

/** Published and hidden posts in ranking order, with their likes by status. */
export async function likeAudit(): Promise<LikeAudit[]> {
  return db()<LikeAudit[]>`
    select p.id, left(p.body, 140) as excerpt, p.status, a.first_name, a.last_name, a.institution,
           count(l.id) filter (where l.status = 'counted')::int as counted,
           count(l.id) filter (where l.status = 'held')::int as held,
           count(l.id) filter (where l.status = 'void')::int as voided,
           count(l.id)::int as total,
           count(l.id) filter (where l.created_at > now() - interval '10 minutes')::int as last10,
           coalesce((select max(g.n) from (select count(*)::int as n from hnh.agora_like x
                                           where x.post_id = p.id and x.status <> 'void' group by x.ip_hash) g), 0) as top_ip
    from hnh.agora_post p
    join hnh.person a on a.id = p.author_person_id
    left join hnh.agora_like l on l.post_id = p.id
    where p.status in ('published', 'hidden')
    group by p.id, a.id
    order by count(l.id) filter (where l.status = 'counted') desc, p.last_counted_like_at asc nulls last, p.published_at asc
    limit 200`;
}

export type LikeGroup = {
  ip_hash: string;
  counted: number;
  held: number;
  voided: number;
  total: number;
  devices: number;
  first_at: Date;
  last_at: Date;
};

/** The likes of one post grouped by network (hashed), biggest group first. */
export async function likeGroups(postId: string): Promise<LikeGroup[]> {
  return db()<LikeGroup[]>`
    select ip_hash,
           count(*) filter (where status = 'counted')::int as counted,
           count(*) filter (where status = 'held')::int as held,
           count(*) filter (where status = 'void')::int as voided,
           count(*)::int as total, count(distinct device_hash)::int as devices,
           min(created_at) as first_at, max(created_at) as last_at
    from hnh.agora_like where post_id = ${postId}
    group by ip_hash order by count(*) desc limit 30`;
}

/** Recomputes a post's public count and the time of its last counted like (the tie-break). Returns the count. */
export async function recountLikes(tx: postgres.TransactionSql, postId: string): Promise<number> {
  const [row] = await tx<{ counted_likes: number }[]>`
    update hnh.agora_post p set
      counted_likes = (select count(*) from hnh.agora_like l where l.post_id = p.id and l.status = 'counted'),
      last_counted_like_at = (select max(l.created_at) from hnh.agora_like l where l.post_id = p.id and l.status = 'counted')
    where p.id = ${postId} returning counted_likes`;
  return row?.counted_likes ?? 0;
}
