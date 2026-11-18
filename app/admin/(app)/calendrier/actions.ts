"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/(public)/moi/actions";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/admin";
import { db } from "@/lib/db";
import { fromTunisInput } from "@/lib/time";

export async function updateWindow(key: string, _prev: FormState, form: FormData): Promise<FormState> {
  const staff = await requireStaff("admin");
  const opensRaw = String(form.get("opens_at") ?? "");
  const closesRaw = String(form.get("closes_at") ?? "");
  const manual = String(form.get("manual_state") ?? "auto");
  const opens = opensRaw ? fromTunisInput(opensRaw) : null;
  const closes = closesRaw ? fromTunisInput(closesRaw) : null;
  if ((opensRaw && !opens) || (closesRaw && !closes)) return { ok: false, errors: {}, message: "Date invalide." };
  if (opens && closes && closes <= opens) return { ok: false, errors: {}, message: "La fermeture doit suivre l'ouverture." };
  if (!["auto", "open", "closed"].includes(manual)) return { ok: false, errors: {}, message: "Mode invalide." };

  const [before] = await db()`select opens_at, closes_at, manual_state from hnh.time_window where key = ${key}`;
  if (!before) return { ok: false, errors: {}, message: "Fenêtre inconnue." };
  await db()`
    update hnh.time_window set opens_at = ${opens}, closes_at = ${closes}, manual_state = ${manual}, updated_at = now()
    where key = ${key}`;
  await audit("staff", staff.id, "window.update", "time_window", key, {
    before,
    after: { opens_at: opens, closes_at: closes, manual_state: manual },
  });
  revalidatePath("/admin/calendrier");
  return { ok: true, errors: {}, message: "Enregistré." };
}
