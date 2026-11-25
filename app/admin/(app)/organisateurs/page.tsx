import type { Metadata } from "next";
import { SimpleActionForm } from "@/components/forms/simple-action-form";
import { requireStaff, ROLE_LABEL } from "@/lib/admin";
import { db } from "@/lib/db";
import type { Staff } from "@/lib/session";
import { addStaff, setStaffActive } from "./actions";

export const metadata: Metadata = { title: "Organisateurs" };

export default async function StaffPage() {
  const me = await requireStaff("admin");
  const staff = await db()<(Staff & { active: boolean })[]>`
    select id, email, display_name, role, active from hnh.staff order by active desc, role, lower(display_name)`;
  return (
    <div className="grid gap-12">
      <div>
        <h1 className="t-headline">Organisateurs</h1>
        <p className="mt-2 max-w-measure text-graphite">
          Administration : tout. Modération : The Wall. Accueil : le scanner et la recherche de participants. Chacun se
          connecte avec un lien envoyé à son email.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-small">
          <thead>
            <tr className="border-b border-jade/30 text-graphite">
              <th scope="col" className="py-2 pr-3 font-semibold">Nom</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Email</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Rôle</th>
              <th scope="col" className="py-2 font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className={`border-b border-jade/10 even:bg-mist/60 ${s.active ? "" : "text-graphite"}`}>
                <td className="py-2.5 pr-3 font-semibold">{s.display_name}</td>
                <td className="py-2.5 pr-3">{s.email}</td>
                <td className="py-2.5 pr-3">
                  {ROLE_LABEL[s.role]}
                  {!s.active && " · désactivé"}
                </td>
                <td className="py-2.5 text-right">
                  {s.id !== me.id && (
                    <form action={setStaffActive.bind(null, s.id, !s.active)}>
                      <button type="submit" className="font-semibold text-emerald underline underline-offset-2">
                        {s.active ? "Désactiver" : "Réactiver"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="add-title" className="max-w-2xl border-t border-jade/15 pt-8">
        <h2 id="add-title" className="t-subhead">
          Ajouter un organisateur
        </h2>
        <div className="mt-4">
          <SimpleActionForm action={addStaff} submitLabel="Ajouter">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="display_name" className="block font-semibold text-ink">
                  Nom
                </label>
                <input id="display_name" name="display_name" maxLength={60} className="control mt-2" />
              </div>
              <div>
                <label htmlFor="staff_email" className="block font-semibold text-ink">
                  Email
                </label>
                <input id="staff_email" name="email" type="email" className="control mt-2" />
              </div>
              <div>
                <label htmlFor="role" className="block font-semibold text-ink">
                  Rôle
                </label>
                <select id="role" name="role" defaultValue="checkin" className="control mt-2">
                  <option value="checkin">Accueil</option>
                  <option value="moderator">Modération</option>
                  <option value="admin">Administration</option>
                </select>
              </div>
            </div>
          </SimpleActionForm>
        </div>
      </section>
    </div>
  );
}
