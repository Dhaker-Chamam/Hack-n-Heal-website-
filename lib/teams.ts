import { COMPETITIONS, type Competition, type ProfileKind } from "./constants";

export type TeamBalance = {
  size: number;
  min: number;
  max: number;
  hasHealth: boolean;
  hasTech: boolean;
  full: boolean;
  complete: boolean; // size within bounds and mix satisfied
  missing: string[]; // human-readable list of what is missing
};

/**
 * Mix rule shared by both competitions: at least one health / life-science
 * profile and at least one tech profile. "both" (bioinformatics) counts for
 * either side, but a single "both" member cannot satisfy both sides alone
 * unless another member covers the other side.
 */
export function teamBalance(competition: Competition, kinds: ProfileKind[]): TeamBalance {
  const { min, max } = COMPETITIONS[competition];
  const size = kinds.length;
  const health = kinds.filter((k) => k === "health").length;
  const tech = kinds.filter((k) => k === "tech").length;
  const both = kinds.filter((k) => k === "both").length;

  // assign "both" members to whichever side is empty first
  let h = health;
  let t = tech;
  let b = both;
  if (h === 0 && b > 0) {
    h = 1;
    b--;
  }
  if (t === 0 && b > 0) {
    t = 1;
    b--;
  }
  const hasHealth = h > 0;
  const hasTech = t > 0;

  const missing: string[] = [];
  if (size < min) {
    const n = min - size;
    missing.push(n === 1 ? "1 membre" : `${n} membres`);
  }
  if (!hasHealth) missing.push("un profil santé");
  if (!hasTech) missing.push("un profil tech");

  return {
    size,
    min,
    max,
    hasHealth,
    hasTech,
    full: size >= max,
    complete: size >= min && size <= max && hasHealth && hasTech,
    missing,
  };
}

export function formatMissing(missing: string[]): string {
  if (missing.length === 0) return "";
  if (missing.length === 1) return missing[0];
  return `${missing.slice(0, -1).join(", ")} et ${missing[missing.length - 1]}`;
}

/** Normalises user input like "med 7k3q", "MED7K3Q" or "med-7k3q" to "MED-7K3Q". */
export function normaliseJoinCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const m = raw.match(/^(MED|BIO)([2-9A-HJ-NP-Z]{4})$/);
  return m ? `${m[1]}-${m[2]}` : null;
}

export function competitionOfCode(code: string): Competition | null {
  if (code.startsWith("MED-")) return "medical";
  if (code.startsWith("BIO-")) return "bioinfo";
  return null;
}
