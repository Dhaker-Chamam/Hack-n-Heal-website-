// Pure data shaping for components/admin/radar-chart.tsx.
import { SKILL_GROUPS, SPECIALITIES } from "./constants";

/** More overlaid polygons than this cannot be told apart. */
export const MAX_RADAR_SERIES = 8;

export type RadarSeries = { name: string; values: number[] };

export const SKILL_AXES: readonly string[] = SKILL_GROUPS.map((g) => g.label);
export const SPECIALITY_AXES: readonly string[] = SPECIALITIES.map((s) => s.label);

/** One value per skill group: the share (0 to 1) of the group's skills the person has. */
export function skillGroupValues(skills: readonly string[]): number[] {
  return SKILL_GROUPS.map((g) => g.skills.filter((s) => skills.includes(s)).length / g.skills.length);
}

/** One value per speciality tag: 1 when the person has it, else 0. */
export function specialityValues(tags: readonly string[]): number[] {
  return SPECIALITIES.map((s) => (tags.includes(s.value) ? 1 : 0));
}

/** Keeps the first MAX_RADAR_SERIES series and counts the rest. */
export function capSeries<T>(series: readonly T[]): { shown: T[]; hidden: number } {
  return { shown: series.slice(0, MAX_RADAR_SERIES), hidden: Math.max(0, series.length - MAX_RADAR_SERIES) };
}

/** Point of axis i out of n at a value from 0 to 1. Axis 0 points up, the others follow clockwise. */
export function radarPoint(i: number, n: number, value: number, radius: number): [number, number] {
  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
  const r = radius * Math.min(1, Math.max(0, value));
  return [Math.round(r * Math.cos(angle) * 100) / 100 || 0, Math.round(r * Math.sin(angle) * 100) / 100 || 0];
}

/** SVG "points" attribute of the polygon joining one value per axis. */
export function radarPolygon(values: readonly number[], radius: number): string {
  return values.map((v, i) => radarPoint(i, values.length, v, radius).join(",")).join(" ");
}
