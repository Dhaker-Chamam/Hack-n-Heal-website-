"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/app/(public)/moi/actions";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/admin";
import { db } from "@/lib/db";

export async function addStaff(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireStaff("admin");
  const parsed = z
    .object({
      email: z.email("Adresse email invalide.").trim().toLowerCase(),
      display_name: z.string().trim().min(2, "Indique un nom.").max(60),
      role: z.enum(["admin", "moderator", "checkin"]),
    })
    .safeParse({ email: form.get("email"), display_name: form.get("display_name"), role: form.get("role") });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[i.path.join("_")] ??= i.message;
    return { ok: false, errors };
  }
  const v = parsed.data;
  const [row] = await db()<{ id: string }[]>`
    insert into hnh.staff (email, display_name, role) values (${v.email}, ${v.display_name}, ${v.role})
    on conflict (lower(email)) do update set display_name = excluded.display_name, role = excluded.role, active = true
    returning id`;
  await audit("staff", me.id, "staff.upsert", "staff", row.id, { role: v.role });
  revalidatePath("/admin/organisateurs");
  return { ok: true, errors: {}, message: `${v.display_name} peut maintenant se connecter avec ${v.email}.` };
}

export async function setStaffActive(id: string, active: boolean) {
  const me = await requireStaff("admin");
  if (id === me.id) return;
  await db()`update hnh.staff set active = ${active} where id = ${id}`;
  if (!active) await db()`delete from hnh.staff_session where staff_id = ${id}`;
  await audit("staff", me.id, active ? "staff.activate" : "staff.deactivate", "staff", id);
  revalidatePath("/admin/organisateurs");
}
