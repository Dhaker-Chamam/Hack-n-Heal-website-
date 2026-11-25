import type { Metadata } from "next";
import Link from "next/link";
import { Lockup } from "@/components/brand/logo";
import { requireStaff, ROLE_LABEL } from "@/lib/admin";
import { AdminNav } from "./admin-nav";
import { staffSignOut } from "./actions";

export const metadata: Metadata = { title: { default: "Organisateurs", template: "%s · Organisateurs" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const items = [
    { href: "/admin", label: "Tableau de bord", roles: ["admin", "moderator", "checkin"] },
    { href: "/admin/inscriptions", label: "Inscriptions", roles: ["admin"] },
    { href: "/admin/equipes", label: "Équipes", roles: ["admin", "moderator"] },
    { href: "/admin/the-wall", label: "The Wall", roles: ["admin", "moderator"] },
    { href: "/admin/calendrier", label: "Calendrier", roles: ["admin"] },
    { href: "/admin/emails", label: "Emails", roles: ["admin"] },
    { href: "/admin/organisateurs", label: "Organisateurs", roles: ["admin"] },
  ].filter((i) => staff.role === "admin" || i.roles.includes(staff.role));

  return (
    <>
      <header className="on-dark bg-abyss text-mist">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 pt-3 md:flex-row md:items-center md:gap-8 md:py-3">
          <Link href="/admin" aria-label="Tableau de bord des organisateurs" className="flex items-center gap-4 py-1">
            <Lockup dark size={20} />
            <span className="border-l border-mist/20 pl-4 text-small text-mist/80">Organisateurs</span>
          </Link>
          <nav aria-label="Administration" className="min-w-0 md:flex-1">
            <AdminNav items={items} />
          </nav>
          <div className="flex items-center gap-4 pb-2 text-small md:pb-0">
            <span className="text-mist/80">
              {staff.display_name} · {ROLE_LABEL[staff.role]}
            </span>
            <form action={staffSignOut}>
              <button type="submit" className="font-semibold text-mist underline decoration-luminous underline-offset-4 hover:text-luminous">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="contenu" className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 md:py-10">
        {children}
      </main>
    </>
  );
}
