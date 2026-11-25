import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";
import { env } from "./env";
import { hmac, safeEqual, tokenHash } from "./crypto";

export const PARTICIPANT_COOKIE = "hnh_p";
export const STAFF_COOKIE = "hnh_s";
export const VOTER_COOKIE = "hnh_v";

const baseCookie = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax" as const,
  path: "/",
};

export type Person = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  institution: string;
  study_level: string;
  specialities: string[];
  profile_kind: "health" | "tech" | "both" | "other";
  skills: string[];
  link_url: string | null;
  facebook: string | null;
  facebook_kind: "url" | "name" | null;
  photo_opt_out: boolean;
  internship_offers_opt_in: boolean;
  cv_path: string | null;
  cv_uploaded_at: Date | null;
  cv_share_opt_in: boolean;
  status: "pending" | "confirmed" | "cancelled" | "rejected";
  email_confirmed_at: Date | null;
  participant_code: string;
  agora_blocked: boolean;
  created_at: Date;
};

export async function setParticipantCookie(token: string) {
  (await cookies()).set(PARTICIPANT_COOKIE, token, { ...baseCookie, maxAge: 60 * 60 * 24 * 45 });
}

export async function clearParticipantCookie() {
  (await cookies()).delete(PARTICIPANT_COOKIE);
}

export async function personByToken(token: string): Promise<Person | null> {
  const [p] = await db()<Person[]>`
    select id, email, first_name, last_name, phone, institution, study_level, specialities, profile_kind,
           skills, link_url, facebook, facebook_kind, photo_opt_out, internship_offers_opt_in, cv_path, cv_uploaded_at, cv_share_opt_in,
           status, email_confirmed_at, participant_code, agora_blocked, created_at
    from hnh.person
    where access_token_hash = ${tokenHash(token)} and anonymized_at is null`;
  return p ?? null;
}

/** The participant behind the personal-link cookie, if any. */
export async function currentPerson(): Promise<Person | null> {
  const token = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  if (!token) return null;
  return personByToken(token);
}

// ------------------------------------------------------------------ voters on The Wall

const voterSignature = (id: string) => hmac(`voter:${id}`);

/** The anonymous voter id of this browser, when it carries a cookie we signed. */
export async function voterId(): Promise<string | null> {
  const [id, signature] = ((await cookies()).get(VOTER_COOKIE)?.value ?? "").split(".");
  if (!id || !signature || !/^[0-9a-f-]{36}$/.test(id)) return null;
  return safeEqual(signature, voterSignature(id)) ? id : null;
}

/** Same, giving the browser an id on its first vote. Only inside a server action or a route handler. */
export async function ensureVoterId(): Promise<string> {
  const existing = await voterId();
  if (existing) return existing;
  const id = crypto.randomUUID();
  (await cookies()).set(VOTER_COOKIE, `${id}.${voterSignature(id)}`, { ...baseCookie, maxAge: 60 * 60 * 24 * 60 });
  return id;
}

// ------------------------------------------------------------------ staff

export type Staff = {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "moderator" | "checkin";
};

export async function setStaffCookie(token: string) {
  (await cookies()).set(STAFF_COOKIE, token, { ...baseCookie, maxAge: 60 * 60 * 24 * 14 });
}

export async function clearStaffCookie() {
  (await cookies()).delete(STAFF_COOKIE);
}

export async function currentStaff(): Promise<Staff | null> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) return null;
  const [s] = await db()<Staff[]>`
    select s.id, s.email, s.display_name, s.role
    from hnh.staff_session ss join hnh.staff s on s.id = ss.staff_id
    where ss.token_hash = ${tokenHash(token)} and ss.expires_at > now() and s.active`;
  return s ?? null;
}

export function staffCan(staff: Staff | null, ...roles: Staff["role"][]): boolean {
  return !!staff && (staff.role === "admin" || roles.includes(staff.role));
}
