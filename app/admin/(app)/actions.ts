"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { tokenHash } from "@/lib/crypto";
import { db } from "@/lib/db";
import { clearStaffCookie, STAFF_COOKIE } from "@/lib/session";

export async function staffSignOut() {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (token) await db()`delete from hnh.staff_session where token_hash = ${tokenHash(token)}`;
  await clearStaffCookie();
  redirect("/admin/connexion");
}
