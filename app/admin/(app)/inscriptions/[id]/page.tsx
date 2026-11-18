import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SimpleActionForm } from "@/components/forms/simple-action-form";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { requireStaff } from "@/lib/admin";
import { COMPETITIONS, DISCIPLINES, PROFILE_KIND_LABEL, type Competition } from "@/lib/constants";
import { db } from "@/lib/db";
import { MAIL_STATUS_LABEL, TEMPLATE_LABEL } from "@/lib/emails";
import { cvUploadEnabled } from "@/lib/env";
import { myParticipations } from "@/lib/participant";
import type { Person } from "@/lib/session";
import { formatMissing } from "@/lib/teams";
import { formatShort } from "@/lib/time";
import { deletePerson, openCv, resendLink, setStatus } from "./actions";

export const metadata: Metadata = { title: "Inscription" };

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente de confirmation",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  rejected: "Refusée",
};
const CONSENT_LABEL: Record<string, string> = {
  privacy: "Règlement et politique de données",
  adult: "18 ans ou plus",
  cv_share: "Transmission du CV",
  internship: "Offres de stage",
  photo_opt_out: "Pas de photos",
  agora_display: "Affichage sur l'Agora",
};

export default async function RegistrationDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff("admin");
  const { id } = await params;
  const { cv } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sql = db();
  const [p] = await sql<(Person & { status_reason: string | null })[]>`select * from hnh.person where id = ${id}`;
  if (!p) notFound();
  const [parts, consents, mails] = await Promise.all([
    myParticipations(id),
    sql<{ kind: string; granted: boolean; text_version: string; created_at: Date }[]>`
      select kind, granted, text_version, created_at from hnh.consent_event where person_id = ${id} order by created_at desc`,
    sql<{ template: string; status: string; created_at: Date; last_error: string | null }[]>`
      select template, status, created_at, last_error from hnh.email_outbox where person_id = ${id} order by created_at desc limit 20`,
  ]);
  const discipline = DISCIPLINES.find((d) => d.value === p.discipline)?.label ?? p.discipline;

  return (
    <div className="grid gap-10">
      <div>
        <Link href="/admin/inscriptions" className="inline-flex items-center gap-1.5 text-small font-semibold text-emerald underline underline-offset-4">
          <ArrowLeft aria-hidden className="size-4" strokeWidth={2} /> Inscriptions
        </Link>
        <h1 className="t-headline mt-4">
          {p.first_name} {p.last_name}
        </h1>
        <p className="mt-1 text-graphite">
          <span className="tabular font-semibold text-ink">{p.participant_code}</span> · {STATUS_LABEL[p.status]}
          {p.status_reason && ` · motif : ${p.status_reason}`}
        </p>
      </div>
      {cv === "absent" && <Alert tone="error" title="Aucun CV disponible pour cette personne." />}

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="id-title">
          <h2 id="id-title" className="t-subhead">
            Profil
          </h2>
          <dl className="mt-3 grid grid-cols-[10rem_1fr] gap-x-4 text-small">
            {[
              ["Email", p.email],
              ["Téléphone", p.phone ?? "—"],
              ["Établissement", p.institution],
              ["Niveau", p.study_level],
              ["Profil", `${discipline} (${PROFILE_KIND_LABEL[p.profile_kind]})`],
              ["Compétences", p.skills.join(", ") || "—"],
              ["Lien", p.link_url ?? "—"],
              ["Inscription", formatShort(p.created_at)],
              ["Confirmation", p.email_confirmed_at ? formatShort(p.email_confirmed_at) : "—"],
              ["Photos", p.photo_opt_out ? "Ne pas photographier" : "Accepte"],
              ["Offres de stage", p.internship_offers_opt_in ? "Oui" : "Non"],
              ["CV", p.cv_path ? (p.cv_share_opt_in ? "Oui, transmission autorisée" : "Oui, non transmis") : "Non"],
            ].map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="border-t border-jade/15 py-2 text-graphite">{k}</dt>
                <dd className="break-words border-t border-jade/15 py-2 text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {p.cv_path && cvUploadEnabled() && (
            <form action={openCv.bind(null, id)} className="mt-4">
              <button type="submit" className={buttonClass("secondary", "sm")}>
                <ExternalLink aria-hidden className="size-4" strokeWidth={1.75} /> Ouvrir le CV (lien de 5 minutes)
              </button>
            </form>
          )}
        </section>

        <section aria-labelledby="part-title">
          <h2 id="part-title" className="t-subhead">
            Compétitions
          </h2>
          <ul className="mt-3 grid gap-3">
            {(["medical", "bioinfo"] as Competition[]).map((c) => {
              const part = parts[c];
              return (
                <li key={c} className="border-t border-jade/15 pt-3 text-small">
                  <p className="font-semibold text-ink">{COMPETITIONS[c].label}</p>
                  {!part ? (
                    <p className="text-graphite">Non inscrit·e</p>
                  ) : part.team ? (
                    <p className="text-ink">
                      {part.team.name} <span className="tabular text-graphite">({part.team.join_code})</span>
                      {part.isLead && " · chef d'équipe"}
                      <span className="block text-graphite">
                        {part.team.balance.size}/{COMPETITIONS[c].max} membres
                        {part.team.balance.complete ? " · complète" : ` · manque ${formatMissing(part.team.balance.missing)}`}
                      </span>
                    </p>
                  ) : (
                    <p className="text-ink">
                      Sans équipe{part.seeking_note && <span className="block text-graphite">« {part.seeking_note} »</span>}
                    </p>
                  )}
                  {part?.kaggle_username && <p className="text-graphite">Kaggle : {part.kaggle_username}</p>}
                </li>
              );
            })}
          </ul>

          <h2 className="t-subhead mt-10">Actions</h2>
          <div className="mt-4 grid gap-6">
            <SimpleActionForm action={resendLink.bind(null, id)} submitLabel="Renvoyer un lien personnel" variant="secondary" size="sm" />
            <SimpleActionForm action={setStatus.bind(null, id)} submitLabel="Changer le statut" variant="secondary" size="sm">
              <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                <div>
                  <label htmlFor="status" className="block text-small font-semibold text-ink">
                    Statut
                  </label>
                  <select id="status" name="status" defaultValue={p.status === "pending" ? "confirmed" : p.status} className="control mt-1 min-h-10! py-2!">
                    <option value="confirmed">Confirmée</option>
                    <option value="cancelled">Annulée</option>
                    <option value="rejected">Refusée</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reason" className="block text-small font-semibold text-ink">
                    Motif <span className="font-normal text-graphite">(annulation ou refus)</span>
                  </label>
                  <input id="reason" name="reason" maxLength={300} className="control mt-1 min-h-10! py-2!" />
                </div>
              </div>
            </SimpleActionForm>
          </div>
        </section>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="consent-title">
          <h2 id="consent-title" className="t-subhead">
            Historique des consentements
          </h2>
          <table className="mt-3 w-full border-collapse text-left text-small">
            <tbody>
              {consents.map((c, i) => (
                <tr key={i} className="border-t border-jade/15">
                  <td className="py-2 pr-3 text-ink">{CONSENT_LABEL[c.kind] ?? c.kind}</td>
                  <td className="py-2 pr-3 font-semibold">{c.granted ? "Oui" : "Non"}</td>
                  <td className="py-2 pr-3 text-graphite">v. {c.text_version}</td>
                  <td className="tabular py-2 text-graphite">{formatShort(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section aria-labelledby="mail-title">
          <h2 id="mail-title" className="t-subhead">
            Emails
          </h2>
          <table className="mt-3 w-full border-collapse text-left text-small">
            <tbody>
              {mails.map((m, i) => (
                <tr key={i} className="border-t border-jade/15">
                  <td className="py-2 pr-3 text-ink">{TEMPLATE_LABEL[m.template] ?? m.template}</td>
                  <td className={`py-2 pr-3 font-semibold ${m.status === "failed" ? "text-danger" : "text-ink"}`}>{MAIL_STATUS_LABEL[m.status] ?? m.status}</td>
                  <td className="tabular py-2 text-graphite">{formatShort(m.created_at)}</td>
                </tr>
              ))}
              {mails.length === 0 && (
                <tr>
                  <td className="py-2 text-graphite">Aucun email.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section aria-labelledby="del-title" className="border-t border-jade/15 pt-8">
        <h2 id="del-title" className="t-subhead">
          Supprimer définitivement
        </h2>
        <p className="mt-1 max-w-measure text-small text-graphite">
          Pour une demande de suppression reçue par email. Efface la personne, ses participations, son CV et ses publications.
        </p>
        <div className="mt-4">
          <SimpleActionForm action={deletePerson.bind(null, id)} submitLabel="Supprimer" variant="danger" size="sm">
            <Checkbox name="confirm" id="del_confirm">
              Supprimer {p.first_name} {p.last_name} et toutes ses données.
            </Checkbox>
          </SimpleActionForm>
        </div>
      </section>
    </div>
  );
}
