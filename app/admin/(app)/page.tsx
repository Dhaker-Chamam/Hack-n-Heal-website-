import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { StatusMarker } from "@/components/ui/markers";
import { requireStaff } from "@/lib/admin";
import { COMPETITIONS, type Competition } from "@/lib/constants";
import { db } from "@/lib/db";
import { teamsWithKinds } from "@/lib/participant";
import { teamBalance } from "@/lib/teams";
import { formatDeadline, formatMoment } from "@/lib/time";
import { getWindows } from "@/lib/windows";

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await requireStaff();
  const { refus } = await searchParams;
  const sql = db();

  const [counts, teams, windows, mail, people] = await Promise.all([
    sql<{ competition: Competition; status: string; seeking: number; n: number }[]>`
      select pa.competition, p.status, count(*) filter (where pa.team_id is null)::int as seeking, count(*)::int as n
      from hnh.participation pa join hnh.person p on p.id = pa.person_id
      where pa.status = 'active' group by 1, 2`,
    teamsWithKinds(),
    getWindows(),
    sql<{ status: string; n: number }[]>`select status, count(*)::int as n from hnh.email_outbox group by 1`,
    sql<{ status: string; n: number }[]>`select status, count(*)::int as n from hnh.person group by 1`,
  ]);

  const balance: Record<Competition, { total: number; complete: number }> = {
    medical: { total: 0, complete: 0 },
    bioinfo: { total: 0, complete: 0 },
  };
  for (const t of teams) {
    balance[t.competition].total++;
    if (teamBalance(t.competition, t.kinds).complete) balance[t.competition].complete++;
  }
  const count = (c: Competition, status: string) => counts.find((r) => r.competition === c && r.status === status);
  const failed = mail.find((m) => m.status === "failed")?.n ?? 0;
  const skipped = mail.find((m) => m.status === "skipped")?.n ?? 0;
  const persons = (s: string) => people.find((p) => p.status === s)?.n ?? 0;

  return (
    <div className="grid gap-12">
      <div>
        <h1 className="t-headline">Tableau de bord</h1>
        <p className="mt-2 text-graphite">
          <span className="tabular font-semibold text-ink">{persons("confirmed")}</span> personnes confirmées ·{" "}
          <span className="tabular">{persons("pending")}</span> en attente de confirmation
        </p>
      </div>

      {refus && <Alert tone="error" title="Ton rôle ne donne pas accès à cette page." />}
      {staff.role === "admin" && failed > 0 && (
        <Alert tone="error" title={`${failed} email${failed > 1 ? "s" : ""} en échec.`}>
          <Link href="/admin/emails?statut=failed" className="font-semibold text-emerald underline">
            Voir les emails
          </Link>
        </Alert>
      )}
      {staff.role === "admin" && skipped > 0 && (
        <Alert tone="info" title="L'envoi d'emails n'est pas configuré.">
          {skipped} email{skipped > 1 ? "s" : ""} non envoyé{skipped > 1 ? "s" : ""}. Renseigne SMTP_HOST, SMTP_USER et SMTP_PASS.
        </Alert>
      )}

      <section aria-labelledby="comp-title">
        <h2 id="comp-title" className="t-subhead">
          Compétitions
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-jade/30 text-small text-graphite">
                <th scope="col" className="py-2 pr-4 font-semibold">Compétition</th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">Confirmés</th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">En attente</th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">Sans équipe</th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">Équipes</th>
                <th scope="col" className="py-2 text-right font-semibold">Complètes</th>
              </tr>
            </thead>
            <tbody>
              {(["medical", "bioinfo"] as Competition[]).map((c) => (
                <tr key={c} className="border-b border-jade/15">
                  <th scope="row" className="py-3 pr-4 font-semibold text-ink">
                    {COMPETITIONS[c].label}
                  </th>
                  <td className="py-3 pr-4 text-right font-semibold">{count(c, "confirmed")?.n ?? 0}</td>
                  <td className="py-3 pr-4 text-right">{count(c, "pending")?.n ?? 0}</td>
                  <td className="py-3 pr-4 text-right">{count(c, "confirmed")?.seeking ?? 0}</td>
                  <td className="py-3 pr-4 text-right">{balance[c].total}</td>
                  <td className="py-3 text-right">
                    {balance[c].complete}
                    <span className="text-graphite"> / {balance[c].total}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="win-title">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="win-title" className="t-subhead">
            Fenêtres en cours
          </h2>
          {staff.role === "admin" && (
            <Link href="/admin/calendrier" className="text-small font-semibold text-emerald underline">
              Modifier le calendrier
            </Link>
          )}
        </div>
        <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
          {Object.values(windows)
            .sort((a, b) => Math.min(+(a.closes_at ?? Infinity), +(a.opens_at ?? Infinity)) - Math.min(+(b.closes_at ?? Infinity), +(b.opens_at ?? Infinity)))
            .map((w) => (
            <li key={w.key} className="flex items-baseline justify-between gap-4 border-b border-jade/15 py-2.5">
              <StatusMarker done={w.is_open}>
                <span className={w.is_open ? "font-semibold text-ink" : "text-graphite"}>{w.label}</span>
              </StatusMarker>
              <span className="shrink-0 text-small text-graphite">
                {w.manual_state !== "auto"
                  ? w.manual_state === "open"
                    ? "ouverte à la main"
                    : "fermée à la main"
                  : w.is_open && w.closes_at
                    ? `jusqu'au ${formatDeadline(w.closes_at)}`
                    : !w.is_open && w.opens_at && w.opens_at > new Date()
                      ? `dès le ${formatMoment(w.opens_at)}`
                      : w.is_open
                        ? "ouverte"
                        : "fermée"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
