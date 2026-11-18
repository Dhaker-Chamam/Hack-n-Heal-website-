import { describe, expect, it } from "vitest";
import { normaliseJoinCode, teamBalance, competitionOfCode, formatMissing } from "../../lib/teams";

describe("teamBalance", () => {
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
