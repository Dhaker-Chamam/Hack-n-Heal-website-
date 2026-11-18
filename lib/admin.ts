import "server-only";
import { redirect } from "next/navigation";
import { currentStaff, staffCan, type Staff } from "./session";

/** Guards an admin page or action. Admins pass every check. */
export async function requireStaff(...roles: Staff["role"][]): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/connexion?raison=session");
  if (roles.length && !staffCan(staff, ...roles)) redirect("/admin?refus=1");
  return staff;
}

export const ROLE_LABEL: Record<Staff["role"], string> = {
  admin: "Administration",
  moderator: "Modération",
  checkin: "Accueil",
};
