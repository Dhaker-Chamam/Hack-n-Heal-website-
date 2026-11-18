import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { requireStaff } from "@/lib/admin";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { formatShort } from "@/lib/time";
import { retry } from "./actions";

export const metadata: Metadata = { title: "Emails" };

const STATUS = { queued: "En file", sent: "Envoyé", failed: "Échec", skipped: "Non envoyé" } as const;
type Status = keyof typeof STATUS;

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ statut?: string; voir?: string }> }) {
  await requireStaff("admin");
  const { statut, voir } = await searchParams;
  const filter = statut && statut in STATUS ? statut : null;
  const rows = await db()<
    { id: number; to_email: string; subject: string; status: Status; last_error: string | null; created_at: Date; has_body: boolean }[]
  >`
    select id, to_email, subject, status, last_error, created_at, (html <> '') as has_body
    from hnh.email_outbox where (${filter}::text is null or status = ${filter})
    order by created_at desc limit 300`;
  // Unsent bodies (they can hold personal links) are readable in development only.
  const [shown] =
    voir && /^\d+$/.test(voir) && !env.isProd
      ? await db()<{ subject: string; text_body: string }[]>`
          select subject, text_body from hnh.email_outbox where id = ${Number(voir)} and status = 'skipped'`
      : [];
  const tabs: [string, string][] = [["", "Tous"], ...(Object.entries(STATUS) as [string, string][])];

  return (
    <div>
      <h1 className="t-headline">Emails</h1>
      {!env.smtp.host && (
        <div className="mt-4">
          <Alert tone="info" title="SMTP non configuré : les emails sont enregistrés sans être envoyés.">
            En développement, leur contenu reste lisible ici.
          </Alert>
        </div>
      )}
      <nav aria-label="Filtrer par statut" className="mt-6 flex flex-wrap gap-2 text-small">
        {tabs.map(([k, l]) => {
          const active = (filter ?? "") === k;
          return (
            <Link
              key={k}
              href={k ? `/admin/emails?statut=${k}` : "/admin/emails"}
              aria-current={active ? "page" : undefined}
              className={`px-3 py-1.5 font-semibold ${active ? "bg-jade text-white" : "border border-jade/30 text-jade hover:bg-mist"}`}
            >
              {l}
            </Link>
          );
        })}
      </nav>
      {shown && (
        <section aria-label="Contenu de l'email" className="mt-6 border border-jade/15 bg-white p-5">
          <p className="font-semibold text-ink">{shown.subject}</p>
          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-small text-ink">{shown.text_body}</pre>
        </section>
      )}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left text-small">
          <thead>
            <tr className="border-b border-jade/30 text-graphite">
              <th scope="col" className="py-2 pr-3 font-semibold">Date</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Destinataire</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Objet</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Statut</th>
              <th scope="col" className="py-2 font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-jade/10 even:bg-mist/60">
                <td className="tabular py-2.5 pr-3 text-graphite">{formatShort(r.created_at)}</td>
                <td className="py-2.5 pr-3 text-ink">{r.to_email}</td>
                <td className="py-2.5 pr-3 text-ink">{r.subject}</td>
                <td className={`py-2.5 pr-3 font-semibold ${r.status === "failed" ? "text-danger" : "text-ink"}`}>
                  {STATUS[r.status]}
                  {r.last_error && <span className="block font-normal text-graphite">{r.last_error.slice(0, 120)}</span>}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-3">
                    {r.status === "skipped" && r.has_body && !env.isProd && (
                      <Link href={`/admin/emails?voir=${r.id}${filter ? `&statut=${filter}` : ""}`} className="font-semibold text-emerald underline">
                        Lire
                      </Link>
                    )}
                    {(r.status === "failed" || (r.status === "skipped" && env.smtp.host)) && r.has_body && (
                      <form action={retry.bind(null, r.id)}>
                        <button type="submit" className={buttonClass("secondary", "sm")}>
                          <RefreshCw aria-hidden className="size-4" strokeWidth={1.75} /> Renvoyer
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-graphite">
                  Aucun email.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
