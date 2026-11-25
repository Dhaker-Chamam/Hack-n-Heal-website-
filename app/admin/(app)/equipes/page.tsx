import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/admin";
import { teamBuilderData } from "@/lib/admin-queries";
import { COMPETITIONS, type Competition } from "@/lib/constants";
import { TeamBuilder } from "./team-builder";

export const metadata: Metadata = { title: "Équipes" };

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ competition?: string; tab?: string }> }) {
  await requireStaff("admin", "moderator");
  const sp = await searchParams;
  const competition: Competition = sp.competition === "bioinfo" ? "bioinfo" : "medical";
  const tab = sp.tab === "libres" ? "libres" : "equipes";
  const { teams, free } = await teamBuilderData(competition);
  const info = COMPETITIONS[competition];
  const tabs = [
    ["equipes", "Équipes", teams.length],
    ["libres", "Sans équipe", free.length],
  ] as const;

  return (
    <div>
      <h1 className="t-headline">Équipes</h1>
      <p className="mt-2 max-w-measure text-graphite">
        {info.label} : de {info.min} à {info.max} membres, avec au moins un profil santé et un profil tech. Les actions de
        cette page restent possibles après la fermeture des équipes aux participants.
      </p>

      <nav aria-label="Compétition" className="mt-6 flex flex-wrap gap-2 text-small">
        {(["medical", "bioinfo"] as Competition[]).map((c) => (
          <Link
            key={c}
            href={`/admin/equipes?competition=${c}&tab=${tab}`}
            aria-current={c === competition ? "page" : undefined}
            className={`px-3 py-1.5 font-semibold ${c === competition ? "bg-jade text-white" : "border border-jade/30 text-jade hover:bg-mist"}`}
          >
            {COMPETITIONS[c].label}
          </Link>
        ))}
      </nav>

      <nav aria-label="Vue" className="mt-6 flex gap-6 border-b border-jade/15 text-small">
        {tabs.map(([key, label, count]) => (
          <Link
            key={key}
            href={`/admin/equipes?competition=${competition}&tab=${key}`}
            aria-current={key === tab ? "page" : undefined}
            className={`-mb-px border-b-2 px-1 py-2.5 font-semibold ${key === tab ? "border-emerald text-jade" : "border-transparent text-graphite hover:text-jade"}`}
          >
            {label} <span className="tabular font-normal">({count})</span>
          </Link>
        ))}
      </nav>

      {/* keyed: a selection made in one competition means nothing in the other */}
      <TeamBuilder key={competition} competition={competition} tab={tab} teams={teams} free={free} />
    </div>
  );
}
