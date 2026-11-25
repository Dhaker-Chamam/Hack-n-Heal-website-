// The Wall: rules and text helpers shared by the public pages, the forms and the back-office. Pure.

export const WALL_MAX_POSTS = 3;
export const WALL_BODY_MIN = 20;
export const WALL_BODY_MAX = 800;
/** Minutes an author waits between two new posts. */
export const WALL_POST_INTERVAL = 10;
/** Open reports that hide a published post until a moderator reviews it. */
export const WALL_REPORTS_TO_HIDE = 3;

/** Likes one network may add per hour, all posts together. Loose: a campus or a mobile operator shares addresses. */
export const LIKES_PER_IP_HOUR = 60;
/** Past this many likes on one post from one network in an hour, further likes are held, not counted. */
export const COUNTED_PER_IP_POST_HOUR = 5;
/** Past this many likes on one post from one device fingerprint in a day, further likes are held. */
export const COUNTED_PER_DEVICE_POST_DAY = 3;

export const REPORT_REASONS = {
  donnees_patient: "Données de patient",
  desinformation: "Désinformation médicale",
  offensant: "Contenu offensant",
  spam: "Spam ou publicité",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;

export type PostStatus = "pending" | "published" | "changes_requested" | "hidden" | "removed";
export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  pending: "En attente de relecture",
  published: "Publié",
  changes_requested: "Modifications demandées",
  hidden: "Masqué, en cours de vérification",
  removed: "Retiré par les modérateurs",
};

/** Length the way Postgres counts it (code points), so the form and the column check agree on emoji. */
export const textLength = (s: string): number => Array.from(s).length;

/** How an author is shown: first name, initial of the last name, school. */
export function authorLabel(firstName: string, lastName: string, institution: string): string {
  const initial = Array.from(lastName.trim())[0];
  return `${firstName.trim()}${initial ? ` ${initial.toUpperCase()}.` : ""} · ${institution}`;
}

/** The link of a post is shown as its domain only. */
export function linkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "lien";
  }
}

/**
 * What a draft seems to contain that could identify someone. Shown as a warning
 * to the author and to the moderator; it never blocks.
 */
export function wallWarnings(text: string): string[] {
  const found: string[] = [];
  if (/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.test(text)) found.push("une adresse email");
  if (/(?<!\d)(?:\+|00)216[\s.-]?\d{2}(?:[\s.-]?\d{3}){2}(?!\d)|(?<!\d)\d{2}[\s.-]\d{3}[\s.-]\d{3}(?!\d)/.test(text)) {
    found.push("un numéro de téléphone");
  } else if (/(?<!\d)\d{8}(?!\d)/.test(text)) {
    found.push("un numéro à 8 chiffres (téléphone ou carte d'identité)");
  }
  // "patient" or "patiente", an optional title, then a capitalised word
  if (/\b[Pp]atiente?\s+(?:(?:M\.|Mme|Mlle|Mr)\s+)?\p{Lu}[\p{L}'’-]+/u.test(text)) found.push("le nom d'un patient");
  return found;
}

/** Whether a new like counts or is held for review, from what the same network and device already did on this post. */
export function likeStatus(sameIpOnPostLastHour: number, sameDeviceOnPostLastDay: number): "counted" | "held" {
  return sameIpOnPostLastHour >= COUNTED_PER_IP_POST_HOUR || sameDeviceOnPostLastDay >= COUNTED_PER_DEVICE_POST_DAY
    ? "held"
    : "counted";
}
