import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const migration = (file: string) => readFileSync(new URL(`../../supabase/migrations/${file}`, import.meta.url), "utf8");

let db: PGlite;

describe("migration 0003", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(migration("0001_init.sql"));
    await db.exec(migration("0002_specialities_facebook.sql"));
    // a participant and a post from before the migration
    await db.exec(`
      insert into hnh.person (id, email, first_name, last_name, institution, study_level, specialities, profile_kind, access_token_hash, participant_code)
      values ('00000000-0000-4000-8000-000000000001', 'old@example.org', 'Amira', 'Ben Ali', 'INSAT', 'Master', '{dev}', 'tech', 'hash-old', 'HNH-OLD01');
      insert into hnh.agora_post (author_person_id, category, body)
      values ('00000000-0000-4000-8000-000000000001', 'idee', 'Un message écrit avant la migration.');`);
    await db.exec(migration("0003_wall_open_mixed_teams.sql"));
    await db.exec(migration("0003_wall_open_mixed_teams.sql")); // twice: it must not fail
  }, 60_000);

  it("keeps existing rows: nobody was asked about mixed teams, posts have no co-author", async () => {
    const person = await db.query<{ study_level: string; mixed_team_ok: boolean | null; specialities: string[] }>(
      "select study_level, mixed_team_ok, specialities from hnh.person where email = 'old@example.org'",
    );
    expect(person.rows).toEqual([{ study_level: "Master", mixed_team_ok: null, specialities: ["dev"] }]);
    const post = await db.query<{ body: string; coauthors: string[] }>("select body, coauthors from hnh.agora_post");
    expect(post.rows).toEqual([{ body: "Un message écrit avant la migration.", coauthors: [] }]);
  });

  it("accepts an author of The Wall with a name, an email and an institution only", async () => {
    await db.exec(`
      insert into hnh.person (email, first_name, last_name, institution, profile_kind, access_token_hash, participant_code)
      values ('wall@example.org', 'Nour', 'Trabelsi', 'Hôpital Charles Nicolle', 'other', 'hash-wall', 'HNH-WALL1')`);
    const { rows } = await db.query<{ study_level: string | null; specialities: string[] }>(
      "select study_level, specialities from hnh.person where email = 'wall@example.org'",
    );
    expect(rows).toEqual([{ study_level: null, specialities: [] }]);
  });

  it("records the mixed-team answer and still rejects unknown consent kinds", async () => {
    const consent = (kind: string) =>
      db.query("insert into hnh.consent_event (person_id, kind, granted, text_version) values ('00000000-0000-4000-8000-000000000001', $1, false, 't')", [kind]);
    await expect(consent("mixed_team")).resolves.toBeTruthy();
    await expect(consent("privacy")).resolves.toBeTruthy();
    await expect(consent("anything")).rejects.toThrow(/check/i);
  });

  it("accepts up to 4 co-authors on a post", async () => {
    const post = (names: string[]) =>
      db.query(
        "insert into hnh.agora_post (author_person_id, category, body, coauthors) values ('00000000-0000-4000-8000-000000000001', 'projet', 'Un message écrit à plusieurs mains.', $1)",
        [names],
      );
    await expect(post(["A B", "C D", "E F", "G H"])).resolves.toBeTruthy();
    await expect(post(["A B", "C D", "E F", "G H", "I J"])).rejects.toThrow(/check/i);
  });

  it("sets the three calendar dates, in Tunis time, and leaves the others", async () => {
    const { rows } = await db.query<{ key: string; opens: string | null; closes: string | null }>(`
      select key, to_char(opens_at at time zone 'Africa/Tunis', 'YYYY-MM-DD HH24:MI') as opens,
             to_char(closes_at at time zone 'Africa/Tunis', 'YYYY-MM-DD HH24:MI') as closes
      from hnh.time_window where key in ('challenge_publish', 'reg_medical', 'jury_scoring', 'teams_medical') order by key`);
    expect(rows).toEqual([
      { key: "challenge_publish", opens: "2026-11-25 10:00", closes: null },
      { key: "jury_scoring", opens: "2026-12-05 08:00", closes: null },
      { key: "reg_medical", opens: null, closes: "2026-11-27 22:00" },
      { key: "teams_medical", opens: null, closes: "2026-11-28 00:00" },
    ]);
  });
});
