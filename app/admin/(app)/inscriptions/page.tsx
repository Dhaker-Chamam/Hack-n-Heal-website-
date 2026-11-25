import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { listRegistrations, tagFilter, type RegistrationFilters } from "@/lib/admin-queries";
import { requireStaff } from "@/lib/admin";
import { PROFILE_KIND_LABEL, SPECIALITIES, specialityLabel } from "@/lib/constants";
import { formatShort } from "@/lib/time";

export const metadata: Metadata = { title: "Inscriptions" };

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  rejected: "Refusée",
};

const PAGE = 200;

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<RegistrationFilters & { page?: string }> }) {
  await requireStaff("admin");
  const f = await searchParams;
  const all = await listRegistrations(f);
  const page = Math.max(1, Number(f.page) || 1);
  const rows = all.slice((page - 1) * PAGE, page * PAGE);
  const qs = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && k !== "page") as [string, string][]);
  const tags = tagFilter(f.tag);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-headline">Inscriptions</h1>
          <p className="tabular mt-1 text-graphite">
            {all.length} résultat{all.length > 1 ? "s" : ""}
          </p>
        </div>
        <a href={`/admin/inscriptions/export?${qs}`} className={buttonClass("secondary", "sm")}>
          <Download aria-hidden className="size-4" strokeWidth={1.75} /> Exporter en CSV
        </a>
      </div>

      <form className="mt-6 grid gap-4 border-y border-jade/15 py-4" role="search">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
          <div>
            <label htmlFor="q" className="block text-small font-semibold text-ink">
              Recherche
            </label>
            <input id="q" name="q" defaultValue={f.q} placeholder="Nom, email, code, établissement" className="control mt-1 min-h-10! py-2!" />
          </div>
          <Select name="competition" label="Compétition" value={f.competition} options={[["", "Toutes"], ["medical", "Médical"], ["bioinfo", "Bioinformatique"]]} />
          <Select name="status" label="Statut" value={f.status} options={[["", "Tous"], ...Object.entries(STATUS_LABEL)]} />
          <Select name="profile" label="Profil" value={f.profile} options={[["", "Tous"], ...Object.entries(PROFILE_KIND_LABEL)]} />
          <label className="flex min-h-10 items-center gap-2 text-small font-semibold text-ink">
            <input type="checkbox" name="sans_equipe" value="1" defaultChecked={f.sans_equipe === "1"} className="size-4" />
            Sans équipe
          </label>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <fieldset>
            <legend className="text-small font-semibold text-ink">
              Spécialités <span className="font-normal text-graphite">(au moins une de celles cochées)</span>
            </legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {SPECIALITIES.map((s) => (
                <label
                  key={s.value}
                  className="cursor-pointer border border-jade/30 bg-white px-3 py-1.5 text-small text-ink transition-colors duration-150 hover:border-jade has-checked:border-emerald has-checked:bg-mist has-checked:font-semibold has-checked:text-jade has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald"
                >
                  <input type="checkbox" name="tag" value={s.value} defaultChecked={tags.includes(s.value)} className="sr-only" />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className={buttonClass("primary", "sm")}>
            <Search aria-hidden className="size-4" strokeWidth={2} /> Filtrer
          </button>
        </div>
      </form>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[64rem] border-collapse text-left text-small">
          <thead>
            <tr className="border-b border-jade/30 text-graphite">
              <th scope="col" className="py-2 pr-3 font-semibold">Nom</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Établissement</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Profil</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Médical</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Bioinformatique</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Statut</th>
              <th scope="col" className="py-2 font-semibold">Inscription</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-jade/10 even:bg-mist/60">
                <td className="py-2.5 pr-3">
                  <Link href={`/admin/inscriptions/${r.id}`} className="font-semibold text-emerald underline underline-offset-2">
                    {r.first_name} {r.last_name}
                  </Link>
                  <span className="block text-graphite">{r.email}</span>
                </td>
                <td className="py-2.5 pr-3 text-ink">{r.institution}</td>
                <td className="py-2.5 pr-3 text-ink">
                  {r.specialities.map(specialityLabel).join(", ")}
                  <span className="block text-graphite">{PROFILE_KIND_LABEL[r.profile_kind]}</span>
                </td>
                <td className="py-2.5 pr-3">
                  <TeamCell inComp={r.medical_in} team={r.medical_team} code={r.medical_code} />
                </td>
                <td className="py-2.5 pr-3">
                  <TeamCell inComp={r.bioinfo_in} team={r.bioinfo_team} code={r.bioinfo_code} />
                </td>
                <td className={`py-2.5 pr-3 ${r.status === "confirmed" ? "font-semibold text-ink" : r.status === "pending" ? "text-graphite" : "font-semibold text-danger"}`}>
                  {STATUS_LABEL[r.status]}
                </td>
                <td className="tabular py-2.5 text-graphite">{formatShort(r.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-graphite">
                  Aucune inscription ne correspond à ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {all.length > PAGE && (
        <nav aria-label="Pages" className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: Math.ceil(all.length / PAGE) }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/inscriptions?${new URLSearchParams([...qs, ["page", String(n)]])}`}
              aria-current={n === page ? "page" : undefined}
              className={`tabular px-3 py-1.5 text-small font-semibold ${n === page ? "bg-jade text-white" : "border border-jade/30 text-jade hover:bg-mist"}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

function TeamCell({ inComp, team, code }: { inComp: boolean; team: string | null; code: string | null }) {
  if (!inComp) return <span className="text-graphite">Non</span>;
  if (!team) return <span className="font-semibold text-jade">Sans équipe</span>;
  return (
    <span className="text-ink">
      {team}
      <span className="tabular block text-graphite">{code}</span>
    </span>
  );
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: [string, string][] }) {
  return (
    <div>
      <label htmlFor={name} className="block text-small font-semibold text-ink">
        {label}
      </label>
      <select id={name} name={name} defaultValue={value ?? ""} className="control mt-1 min-h-10! py-2!">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
