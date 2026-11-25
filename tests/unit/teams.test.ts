import { describe, expect, it } from "vitest";
import { SPECIALITIES } from "../../lib/constants";
import {
  normaliseJoinCode,
  teamBalance,
  competitionOfCode,
  formatMissing,
  profileKindOf,
  teamComposition,
} from "../../lib/teams";

describe("profileKindOf", () => {
  it("is health or tech when the tags stay on one side", () => {
    for (const tag of ["medecine", "pharmacie", "biologie", "chimie"]) expect(profileKindOf([tag]), tag).toBe("health");
    for (const tag of ["dev", "ai_data"]) expect(profileKindOf([tag]), tag).toBe("tech");
    expect(profileKindOf(["medecine", "pharmacie", "chimie"])).toBe("health");
    expect(profileKindOf(["dev", "ai_data"])).toBe("tech");
  });

  it("is both when the tags reach both sides or include bioinformatics", () => {
    expect(profileKindOf(["medecine", "dev"])).toBe("both");
    expect(profileKindOf(["chimie", "ai_data", "autre"])).toBe("both");
    expect(profileKindOf(["bioinformatique"])).toBe("both");
    expect(profileKindOf(["bioinformatique", "autre"])).toBe("both");
  });

  it("is other with only neutral, unknown or no tags", () => {
    expect(profileKindOf(["autre"])).toBe("other");
    expect(profileKindOf([])).toBe("other");
    expect(profileKindOf(["informatique"])).toBe("other");
  });

  it("ignores the neutral tag next to a side", () => {
    expect(profileKindOf(["autre", "medecine"])).toBe("health");
    expect(profileKindOf(["autre", "dev"])).toBe("tech");
  });

  it("covers every tag of the list", () => {
    const sides = Object.fromEntries(SPECIALITIES.map((s) => [s.value, profileKindOf([s.value])]));
    expect(sides).toEqual({
      medecine: "health",
      pharmacie: "health",
      biologie: "health",
      chimie: "health",
      bioinformatique: "both",
      dev: "tech",
      ai_data: "tech",
      autre: "other",
    });
  });
});

describe("teamComposition", () => {
  it("counts members, tech, health and both without overlap", () => {
    expect(teamComposition(["tech", "tech", "health", "both", "other"])).toEqual({ members: 5, tech: 2, health: 1, both: 1 });
    expect(teamComposition([])).toEqual({ members: 0, tech: 0, health: 0, both: 0 });
  });

  it("counts from speciality tags through profileKindOf", () => {
    const team = [["dev"], ["ai_data", "dev"], ["medecine"], ["biologie", "dev"], ["bioinformatique"], ["autre"]];
    expect(teamComposition(team.map(profileKindOf))).toEqual({ members: 6, tech: 2, health: 1, both: 2 });
  });
});

describe("teamBalance", () => {
  it("works from speciality tags: a two-sided member fills the missing side, never both alone", () => {
    const balance = (...team: string[][]) => teamBalance("bioinfo", team.map(profileKindOf));
    expect(balance(["medecine", "dev"], ["dev"]).complete).toBe(true);
    expect(balance(["medecine", "dev"], ["pharmacie"]).complete).toBe(true);
    expect(balance(["medecine", "dev"], ["chimie", "ai_data"]).complete).toBe(true);
    const alone = balance(["medecine", "dev"], ["autre"]);
    expect(alone.complete).toBe(false);
    expect(alone.missing).toEqual(["un profil tech"]);
    expect(balance(["chimie"], ["biologie"]).missing).toEqual(["un profil tech"]);
  });

  it("medical team of 4 with health and tech is complete", () => {
    const b = teamBalance("medical", ["health", "tech", "tech", "health"]);
    expect(b.complete).toBe(true);
    expect(b.missing).toEqual([]);
  });

  it("medical team of 3 misses one member", () => {
    const b = teamBalance("medical", ["health", "tech", "tech"]);
    expect(b.complete).toBe(false);
    expect(b.missing).toEqual(["1 membre"]);
  });

  it("all-tech team misses a health profile", () => {
    const b = teamBalance("medical", ["tech", "tech", "tech", "tech"]);
    expect(b.hasHealth).toBe(false);
    expect(b.missing).toContain("un profil santé");
  });

  it("bioinformatics counts as either side but one person cannot cover both", () => {
    expect(teamBalance("bioinfo", ["both", "tech"]).complete).toBe(true);
    expect(teamBalance("bioinfo", ["both", "health"]).complete).toBe(true);
    expect(teamBalance("bioinfo", ["both", "both"]).complete).toBe(true);
    const solo = teamBalance("bioinfo", ["both"]);
    expect(solo.complete).toBe(false);
    expect(solo.missing).toEqual(["1 membre", "un profil tech"]);
  });

  it("'other' profiles count for size only", () => {
    const b = teamBalance("bioinfo", ["other", "other"]);
    expect(b.size).toBe(2);
    expect(b.complete).toBe(false);
  });

  it("flags full teams at the maximum", () => {
    expect(teamBalance("medical", Array(7).fill("tech")).full).toBe(true);
    expect(teamBalance("bioinfo", ["health", "tech", "tech", "tech"]).full).toBe(true);
  });
});

describe("join codes", () => {
  it("normalises common inputs", () => {
    expect(normaliseJoinCode("med 7k3q")).toBe("MED-7K3Q");
    expect(normaliseJoinCode("BIO-ab2c")).toBe("BIO-AB2C");
    expect(normaliseJoinCode("bio_ab2c")).toBe("BIO-AB2C");
  });
  it("rejects ambiguous characters and wrong prefixes", () => {
    expect(normaliseJoinCode("MED-7K3O")).toBeNull();
    expect(normaliseJoinCode("MED-1234")).toBeNull();
    expect(normaliseJoinCode("XYZ-7K3Q")).toBeNull();
  });
  it("detects the competition", () => {
    expect(competitionOfCode("MED-7K3Q")).toBe("medical");
    expect(competitionOfCode("BIO-7K3Q")).toBe("bioinfo");
  });
});

describe("formatMissing", () => {
  it("joins in French", () => {
    expect(formatMissing(["1 membre", "un profil santé"])).toBe("1 membre et un profil santé");
    expect(formatMissing(["a", "b", "c"])).toBe("a, b et c");
  });
});
