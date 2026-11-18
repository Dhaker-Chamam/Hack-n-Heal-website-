import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/** 256-bit random token, URL-safe. */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Hash for tokens stored in the database. */
export function tokenHash(token: string): string {
  return sha256(`tok:${token}`);
}

/** Salted pseudonymisation for IPs, devices and reporter ids. Raw values are never stored. */
export function pseudo(kind: string, value: string): string {
  return sha256(`${env.hashSalt}:${kind}:${value}`).slice(0, 32);
}

export function hmac(value: string): string {
  return createHmac("sha256", env.appSecret).update(value).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I

export function randomCode(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}
