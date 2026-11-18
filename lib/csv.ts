/**
 * CSV for French Excel: semicolon separator, UTF-8 BOM, CRLF.
 * Cells starting with = + - @ are prefixed to block formula injection.
 */
export function toCsv(header: string[], rows: (string | number | boolean | null | undefined | Date)[][]): string {
  const cell = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    let s = v instanceof Date ? v.toISOString() : typeof v === "boolean" ? (v ? "oui" : "non") : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
