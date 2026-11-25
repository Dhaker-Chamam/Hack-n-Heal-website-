import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { SPECIALITY_VALUES } from "../../lib/constants";
import { profileKindOf } from "../../lib/teams";

const migration = (file: string) => readFileSync(new URL(`../../supabase/migrations/${file}`, import.meta.url), "utf8");

// Every discipline the first schema accepted, with the profile_kind the old code stored for it.
const OLD = [
  ["medecine", "health", ["medecine"]],
  ["pharmacie", "health", ["pharmacie"]],
  ["biologie", "health", ["biologie"]],
  ["bioinformatique", "both", ["bioinformatique"]],
  ["informatique", "tech", ["dev"]],
  ["data_ia", "tech", ["ai_data"]],
  ["autre", "other", ["autre"]],
] as const;

let db: PGlite;
let n = 0;

function insertOld(discipline: string, kind: string) {
  n++;
  return db.query(
    `insert into hnh.person (email, first_name, last_name, institution, study_level, discipline, profile_kind, skills, access_token_hash, participant_code)
     values ($1, 'Prénom', $2, 'INSAT', 'Master', $2, $3, '{Python}', $4, $5)`,
    [`p${n}@example.org`, discipline, kind, `hash-${n}`, `HNH-${n}`],
  );
}

const people = async () =>
  (
    await db.query<{ last_name: string; discipline: string | null; specialities: string[]; profile_kind: string; skills: string[] }>(
      "select last_name, discipline, specialities, profile_kind, skills from hnh.person order by created_at, participant_code",
    )
  ).rows;

describe("migration 0002", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(migration("0001_init.sql"));
    for (const [discipline, kind] of OLD) await insertOld(discipline, kind);
    await db.exec(migration("0002_specialities_facebook.sql"));
  }, 60_000);

  it("gives every existing row its speciality and keeps the rest of the row", async () => {
    const rows = await people();
    expect(rows).toHaveLength(OLD.length);
    for (const [discipline, kind, tags] of OLD) {
      const row = rows.find((r) => r.last_name === discipline)!;
      expect(row.specialities, discipline).toEqual(tags);
      expect(row.profile_kind, discipline).toBe(kind);
      expect(row.discipline, discipline).toBe(discipline);
      expect(row.skills).toEqual(["Python"]);
    }
  });

  it("computes profile_kind like profileKindOf", async () => {
    const combos = [...SPECIALITY_VALUES.map((v) => [v]), ["medecine", "dev"], ["chimie", "autre"], ["ai_data", "autre"], ["chimie", "ai_data"]];
    await db.exec("begin");
    for (const tags of combos) {
      n++;
      await db.query(
        `insert into hnh.person (email, first_name, last_name, institution, study_level, specialities, profile_kind, access_token_hash, participant_code)
         values ($1, 'Prénom', 'Combo', 'INSAT', 'Master', $2, 'other', $3, $4)`,
        [`p${n}@example.org`, tags, `hash-${n}`, `HNH-${n}`],
      );
    }
    await db.exec(migration("0002_specialities_facebook.sql"));
    const { rows } = await db.query<{ specialities: string[]; profile_kind: string }>(
      "select specialities, profile_kind from hnh.person where last_name = 'Combo'",
    );
    expect(rows).toHaveLength(combos.length);
    for (const r of rows) expect(r.profile_kind, r.specialities.join("+")).toBe(profileKindOf(r.specialities));
    await db.exec("rollback");
  });

  it("can run again, picks up rows the old code wrote meanwhile and leaves edited rows alone", async () => {
    await insertOld("data_ia", "tech"); // old code, after the migration: discipline only
    await db.query("update hnh.person set specialities = '{medecine,dev}', profile_kind = 'both' where last_name = 'medecine'");
    await db.exec(migration("0002_specialities_facebook.sql"));
    const rows = await people();
    expect(rows.filter((r) => r.discipline === "data_ia").map((r) => r.specialities)).toEqual([["ai_data"], ["ai_data"]]);
    const edited = rows.find((r) => r.last_name === "medecine")!;
    expect(edited.specialities).toEqual(["medecine", "dev"]);
    expect(edited.profile_kind).toBe("both");
  });

  it("accepts new rows without a discipline and rejects unknown values", async () => {
    const insert = (specialities: string[], facebookKind: string | null) => {
      n++;
      return db.query(
        `insert into hnh.person (email, first_name, last_name, institution, study_level, specialities, profile_kind, facebook, facebook_kind, access_token_hash, participant_code)
         values ($1, 'Prénom', 'Nouveau', 'INSAT', 'Master', $2, 'both', 'Amira Ben Ali', $3, $4, $5)`,
        [`p${n}@example.org`, specialities, facebookKind, `hash-${n}`, `HNH-${n}`],
      );
    };
    await expect(insert(["chimie", "ai_data"], "name")).resolves.toBeTruthy();
    await expect(insert(["informatique"], "name")).rejects.toThrow(/check/i);
    await expect(insert(["dev"], "page")).rejects.toThrow(/check/i);
  });
});
