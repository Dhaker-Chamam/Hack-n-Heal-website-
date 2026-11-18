import { describe, expect, it } from "vitest";
import { deadlineParts, formatDeadline, fromTunisInput, toTunisInput, tunisDay } from "@/lib/time";

describe("deadlines", () => {
  it("shows an exclusive midnight close as 23:59 the day before", () => {
    const close = new Date("2026-11-27T00:00:00+01:00");
    expect(deadlineParts(close)).toEqual({ day: "jeudi 26 novembre", time: "23:59" });
    expect(formatDeadline(close)).toBe("jeudi 26 novembre à 23:59");
  });
  it("keeps other times as they are", () => {
    expect(formatDeadline(new Date("2026-12-03T20:00:00+01:00"))).toBe("jeudi 3 décembre à 20:00");
  });
  it("round-trips datetime-local values in Tunis time", () => {
    const d = fromTunisInput("2026-11-28T10:00")!;
    expect(d.toISOString()).toBe("2026-11-28T09:00:00.000Z");
    expect(toTunisInput(d)).toBe("2026-11-28T10:00");
    expect(fromTunisInput("nope")).toBeNull();
  });
  it("computes the local day", () => {
    expect(tunisDay(new Date("2026-12-04T23:30:00Z"))).toBe("2026-12-05");
  });
});
