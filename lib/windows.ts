import "server-only";
import { db } from "./db";

export type WindowKey =
  | "reg_medical"
  | "teams_medical"
  | "reg_bioinfo"
  | "challenge_publish"
  | "submit_medical"
  | "agora_post"
  | "agora_vote"
  | "games"
  | "bioinfo_reveal"
  | "checkin"
  | "jury_scoring";

export type TimeWindow = {
  key: WindowKey;
  label: string;
  opens_at: Date | null;
  closes_at: Date | null;
  manual_state: "auto" | "open" | "closed";
  is_open: boolean;
};

export async function getWindows(): Promise<Record<WindowKey, TimeWindow>> {
  const rows = await db()<TimeWindow[]>`
    select key, label, opens_at, closes_at, manual_state, hnh.window_is_open(key) as is_open
    from hnh.time_window order by key`;
  return Object.fromEntries(rows.map((r) => [r.key, r])) as Record<WindowKey, TimeWindow>;
}

export async function getWindow(key: WindowKey): Promise<TimeWindow> {
  const [row] = await db()<TimeWindow[]>`
    select key, label, opens_at, closes_at, manual_state, hnh.window_is_open(key) as is_open
    from hnh.time_window where key = ${key}`;
  return row;
}

/** True when the window has not opened yet (and is not forced open). */
export function notYetOpen(w: TimeWindow): boolean {
  return !w.is_open && w.manual_state === "auto" && w.opens_at !== null && w.opens_at.getTime() > Date.now();
}
