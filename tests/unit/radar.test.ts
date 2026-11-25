import { describe, expect, it } from "vitest";
import { SKILLS, SKILL_GROUPS, SPECIALITIES } from "../../lib/constants";
import {
  MAX_RADAR_SERIES,
  SKILL_AXES,
  SPECIALITY_AXES,
  capSeries,
  radarPoint,
  radarPolygon,
  skillGroupValues,
  specialityValues,
} from "../../lib/radar";

describe("skill groups", () => {
  it("put every skill in exactly one group", () => {
    const grouped = SKILL_GROUPS.flatMap((g) => [...g.skills]).sort();
    expect(grouped).toEqual([...SKILLS].sort());
  });

  it("stay readable as radar axes", () => {
    expect(SKILL_AXES.length).toBeGreaterThanOrEqual(6);
    expect(SKILL_AXES.length).toBeLessThanOrEqual(8);
  });
});

describe("skillGroupValues", () => {
  it("is the share of each group's skills the person has", () => {
    // groups: Code & stats (3), IA (4), Web & design (3), Biologie (2), Santé (3), Pitch (1)
    expect(skillGroupValues(["Python", "Machine learning", "Deep learning", "Pitch"])).toEqual([1 / 3, 0.5, 0, 0, 0, 1]);
    expect(skillGroupValues(["Génomique", "Biologie moléculaire", "Santé publique"])).toEqual([0, 0, 0, 1, 1 / 3, 0]);
  });

  it("is all zeros without skills and ignores unknown ones", () => {
    expect(skillGroupValues([])).toEqual([0, 0, 0, 0, 0, 0]);
    expect(skillGroupValues(["Cobol"])).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe("specialityValues", () => {
  it("has one 0/1 axis per speciality tag, in the order of SPECIALITIES", () => {
    expect(SPECIALITY_AXES).toHaveLength(8);
    expect(SPECIALITY_AXES).toEqual(SPECIALITIES.map((s) => s.label));
    expect(specialityValues(["medecine", "ai_data"])).toEqual([1, 0, 0, 0, 0, 0, 1, 0]);
    expect(specialityValues([])).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
});

describe("capSeries", () => {
  it("keeps at most MAX_RADAR_SERIES series and counts the rest", () => {
    const ten = Array.from({ length: 10 }, (_, i) => i);
    expect(capSeries(ten)).toEqual({ shown: [0, 1, 2, 3, 4, 5, 6, 7], hidden: 10 - MAX_RADAR_SERIES });
    expect(capSeries([1, 2])).toEqual({ shown: [1, 2], hidden: 0 });
  });
});

describe("radar geometry", () => {
  it("starts at the top and turns clockwise", () => {
    expect(radarPoint(0, 4, 1, 100)).toEqual([0, -100]);
    expect(radarPoint(1, 4, 1, 100)).toEqual([100, 0]);
    expect(radarPoint(2, 4, 1, 100)).toEqual([0, 100]);
    expect(radarPoint(3, 4, 0.5, 100)).toEqual([-50, 0]);
  });

  it("clamps values to the chart", () => {
    expect(radarPoint(0, 4, 2, 100)).toEqual([0, -100]);
    expect(radarPoint(0, 4, -1, 100)).toEqual([0, 0]);
  });

  it("builds the polygon points of a series", () => {
    expect(radarPolygon([1, 0.5, 0, 1], 100)).toBe("0,-100 50,0 0,0 -100,0");
  });
});
