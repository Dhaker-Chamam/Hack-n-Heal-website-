"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin";
import { retryMail } from "@/lib/email";

export async function retry(id: number) {
  await requireStaff("admin");
  await retryMail(id);
  revalidatePath("/admin/emails");
}
