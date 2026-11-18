import "server-only";
import QRCode from "qrcode";
import { hmac, safeEqual } from "./crypto";

/** Badge / check-in payload: no personal data, only an id and a signature. */
export function qrPayload(personId: string): string {
  const sig = hmac(`qr:${personId}`).slice(0, 16);
  return `HNH1.${personId}.${sig}`;
}

export function verifyQrPayload(payload: string): string | null {
  const m = payload.trim().match(/^HNH1\.([0-9a-f-]{36})\.([A-Za-z0-9_-]{16})$/);
  if (!m) return null;
  const expected = hmac(`qr:${m[1]}`).slice(0, 16);
  return safeEqual(expected, m[2]) ? m[1] : null;
}

export async function qrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#0D1F1EFF", light: "#FFFFFFFF" },
  });
}

export async function qrPng(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
    color: { dark: "#0D1F1EFF", light: "#FFFFFFFF" },
  });
}
