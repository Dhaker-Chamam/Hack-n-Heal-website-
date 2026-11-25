import { describe, expect, it } from "vitest";
import { closedSince, hasClosed, isPaused, notYetOpen, type TimeWindow } from "../../lib/windows";

const HOUR = 3_600_000;
const at = (hours: number) => new Date(Date.now() + hours * HOUR);
const win = (over: Partial<TimeWindow>): TimeWindow => ({
  key: "reg_bioinfo",
  label: "Inscriptions",
  opens_at: null,
  closes_at: null,
  manual_state: "auto",
  is_open: true,
  ...over,
});

describe("window states", () => {
  it("an open window is neither closed, paused nor upcoming", () => {
    const w = win({ closes_at: at(24) });
    expect([notYetOpen(w), hasClosed(w), isPaused(w)]).toEqual([false, false, false]);
    expect(closedSince(w)).toBe("");
  });

  it("a window before its opening time is upcoming, not closed", () => {
    const w = win({ opens_at: at(24), closes_at: at(48), is_open: false });
    expect([notYetOpen(w), hasClosed(w), isPaused(w)]).toEqual([true, false, false]);
  });

  it("a window past its closing time has closed for good, with its date", () => {
    const w = win({ closes_at: at(-2), is_open: false });
    expect([notYetOpen(w), hasClosed(w), isPaused(w)]).toEqual([false, true, false]);
    expect(closedSince(w)).toMatch(/^ depuis le .+ à \d{2}:\d{2}$/);
  });

  it("a window closed by hand before its closing time is paused, and shows no date", () => {
    const w = win({ closes_at: at(24), manual_state: "closed", is_open: false });
    expect([notYetOpen(w), hasClosed(w), isPaused(w)]).toEqual([false, true, true]);
    expect(closedSince(w)).toBe("");
  });

  it("a window closed by hand after its closing time is simply closed", () => {
    const w = win({ closes_at: at(-2), manual_state: "closed", is_open: false });
    expect(isPaused(w)).toBe(false);
    expect(closedSince(w)).not.toBe("");
  });

  it("a window forced open is open whatever its dates", () => {
    const w = win({ closes_at: at(-2), manual_state: "open", is_open: true });
    expect([notYetOpen(w), hasClosed(w), isPaused(w)]).toEqual([false, false, false]);
  });
});
