export const TZ = "Africa/Tunis";

const dayFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const shortFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Windows store an exclusive end. A close at local midnight is shown as
 * "23:59" the day before, which is how people read deadlines.
 */
export function deadlineParts(closesAt: Date): { day: string; time: string } {
  const local = timeFmt.format(closesAt);
  if (local === "00:00") {
    const prev = new Date(closesAt.getTime() - 60_000);
    return { day: dayFmt.format(prev), time: "23:59" };
  }
  return { day: dayFmt.format(closesAt), time: local };
}

export function formatDeadline(closesAt: Date): string {
  const { day, time } = deadlineParts(closesAt);
  return `${day} à ${time}`;
}

export function formatMoment(d: Date): string {
  const t = timeFmt.format(d);
  return `${dayFmt.format(d)} à ${t}`;
}

export function formatShort(d: Date): string {
  return shortFmt.format(d);
}

export function formatTime(d: Date): string {
  return timeFmt.format(d);
}

/** Local calendar day (YYYY-MM-DD) in Tunis. */
export function tunisDay(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Value for <input type="datetime-local"> in Tunis time (UTC+1, no DST since 2009). */
export function toTunisInput(d: Date | null): string {
  if (!d) return "";
  const local = new Date(d.getTime() + 60 * 60_000);
  return local.toISOString().slice(0, 16);
}

/** Parses a datetime-local value entered in Tunis time. */
export function fromTunisInput(v: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00+01:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2026-11-26 19:56" in Tunis time, for CSV exports. */
export function tunisStamp(d: Date | null): string {
  return d ? toTunisInput(d).replace("T", " ") : "";
}
