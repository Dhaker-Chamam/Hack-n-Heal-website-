import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("uses semicolons, a BOM and CRLF", () => {
    expect(toCsv(["a", "b"], [["1", "2"]])).toBe("﻿a;b\r\n1;2\r\n");
  });
  it("quotes separators and quotes", () => {
    expect(toCsv(["x"], [['dit "oui"; ok']])).toContain('"dit ""oui""; ok"');
  });
  it("neutralises formulas", () => {
    expect(toCsv(["x"], [["=HYPERLINK(1)"], ["+216 20"]])).toContain("'=HYPERLINK(1)\r\n'+216 20");
  });
  it("renders booleans and nulls", () => {
    expect(toCsv(["a", "b", "c"], [[true, false, null]])).toContain("oui;non;");
  });
});
