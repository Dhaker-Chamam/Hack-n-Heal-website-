import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cvUploadEnabled, env } from "./env";

const BUCKET = "cvs";
export const CV_MAX_BYTES = 3 * 1024 * 1024;

function client() {
  return createClient(env.supabaseUrl!, env.supabaseServiceKey!, { auth: { persistSession: false } });
}

/** Returns an error message, or null when the file is an acceptable PDF. */
export async function checkPdf(file: File): Promise<string | null> {
  if (file.size === 0) return "Le fichier est vide.";
  if (file.size > CV_MAX_BYTES) return "Le CV dépasse 3 Mo. Exporte-le en PDF plus léger.";
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const magic = String.fromCharCode(...head);
  if (magic !== "%PDF-") return "Le CV doit être un fichier PDF.";
  return null;
}

export async function uploadCv(personId: string, file: File): Promise<string | null> {
  if (!cvUploadEnabled()) return null;
  const path = `${personId}/${crypto.randomUUID()}.pdf`;
  const { error } = await client()
    .storage.from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: "application/pdf", upsert: false });
  if (error) {
    console.error("[cv:upload]", error);
    return null;
  }
  return path;
}

export async function deleteCv(path: string) {
  if (!cvUploadEnabled()) return;
  await client().storage.from(BUCKET).remove([path]);
}

export async function signedCvUrl(path: string): Promise<string | null> {
  if (!cvUploadEnabled()) return null;
  const { data } = await client().storage.from(BUCKET).createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

export async function downloadCv(path: string): Promise<Buffer | null> {
  if (!cvUploadEnabled()) return null;
  const { data } = await client().storage.from(BUCKET).download(path);
  return data ? Buffer.from(await data.arrayBuffer()) : null;
}
