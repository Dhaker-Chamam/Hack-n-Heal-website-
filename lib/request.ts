import "server-only";
import { headers } from "next/headers";
import { pseudo } from "./crypto";

/** Client IP as seen by Vercel / the dev server. Never stored raw. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0"
  );
}

export async function ipHash(): Promise<string> {
  return pseudo("ip", await clientIp());
}

/** Coarse device fingerprint: user agent + language (+ optional client hints sent by the form). */
export async function deviceHash(extra = ""): Promise<string> {
  const h = await headers();
  return pseudo("device", `${h.get("user-agent") ?? ""}|${h.get("accept-language") ?? ""}|${extra}`);
}
