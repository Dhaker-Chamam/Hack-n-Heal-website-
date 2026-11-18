import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CopyCode } from "@/components/copy-code";
import { SimpleActionForm } from "@/components/forms/simple-action-form";
import { TeamChoiceForm } from "@/components/forms/team-choice-form";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/field";
import { Squares, StatusMarker } from "@/components/ui/markers";
import { COMPETITIONS, DISCIPLINES, type Competition } from "@/lib/constants";
import { env } from "@/lib/env";
import { myParticipations } from "@/lib/participant";
import { currentPerson } from "@/lib/session";
import { formatMissing } from "@/lib/teams";
import { formatDeadline } from "@/lib/time";
import { getWindows } from "@/lib/windows";
import { changeTeam, joinCompetition, leaveMyTeam, manageMember, renameTeam, withdrawCompetition } from "../actions";

export const metadata: Metadata = { title: "Mon équipe" };

const disciplineLabel = (v: string) => DISCIPLINES.find((d) => d.value === v)?.label ?? v;

export default async function TeamPage({ params }: { params: Promise<{ competition: string }> }) {
  const { competition } = await params;
  if (competition !== "medical" && competition !== "bioinfo") notFound();
  const c = competition as Competition;
  const person = await currentPerson();
  if (!person || person.status !== "confirmed") redirect("/lien?raison=session");

  const [parts, windows] = await Promise.all([myParticipations(person.id), getWindows()]);
  const info = COMPETITIONS[c];
  const part = parts[c];
  const reg = windows[info.regWindow as "reg_medical"];
  const teamWindow = windows[info.teamWindow as "teams_medical"];
  const team = part?.team ?? null;
  const editable = teamWindow.is_open && !team?.locked_at;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:py-14">
      <Link href="/moi" className="inline-flex items-center gap-1.5 text-small font-semibold text-emerald underline underline-offset-4">
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} /> Mon espace
      </Link>

      {!part ? (
        <>
          <h1 className="t-headline mt-6">Participer au {info.label.toLowerCase()}</h1>
          <p className="mt-3 max-w-measure text-graphite">
            Équipes de {info.min} à {info.max}, avec au moins un profil santé et un profil tech.
          </p>
          <div className="mt-8">
            {reg.is_open ? (
              <TeamChoiceForm competition={c} action={joinCompetition.bind(null, c)} withCompetitionFields submitLabel="Confirmer ma participation" />
            ) : (
              <Alert tone="info" title="Les inscriptions à cette compétition sont closes." />
            )}
          </div>
        </>
      ) : !team ? (
        <>
          <h1 className="t-headline mt-6">{info.label}</h1>
          <p className="mt-3 max-w-measure text-ink">
            {part.seeking_team
              ? "Tu es en recherche d'équipe : les organisateurs te placeront dans une équipe qui a besoin de ton profil. Tu peux aussi créer ou rejoindre une équipe toi-même."
              : "Tu n'as pas encore d'équipe."}
          </p>
          <div className="mt-8">
            {editable ? (
              <TeamChoiceForm competition={c} action={changeTeam.bind(null, c)} allowSeek={!part.seeking_team} submitLabel="Valider" />
            ) : (
              <Alert tone="info" title="Les équipes sont verrouillées.">
                Les organisateurs placent les participants sans équipe. Tu recevras un email.
              </Alert>
            )}
          </div>
        </>
      ) : (
        <>
          <h1 className="t-headline mt-6">{team.name}</h1>
          <p className="mt-2 text-graphite">
            {info.label} · {info.rhythm}
          </p>

          <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section aria-labelledby="code-title">
              <h2 id="code-title" className="t-subhead">
                Code d&apos;équipe
              </h2>
              <p className="mt-1 text-small text-graphite">Tes coéquipiers le saisissent à l&apos;inscription ou dans leur espace.</p>
              <div className="mt-4">
                <CopyCode
                  code={team.join_code}
                  shareText={`Rejoins l'équipe ${team.name} au ${info.label} de Hack'n'Heal 2026 avec le code ${team.join_code} : ${env.appUrl}/inscription`}
                />
              </div>
            </section>

            <section aria-labelledby="balance-title">
              <h2 id="balance-title" className="t-subhead">
                Composition
              </h2>
              <div className="mt-4">
                <Squares filled={team.balance.size} total={info.max} label={`${team.balance.size} membres sur ${info.max}`} />
                <p className="tabular mt-2 text-small text-graphite">
                  {team.balance.size} sur {info.max} places · minimum {info.min}
                </p>
              </div>
              <ul className="mt-4 grid gap-1.5 text-ink">
                <li>
                  <StatusMarker done={team.balance.size >= info.min}>Au moins {info.min} membres</StatusMarker>
                </li>
                <li>
                  <StatusMarker done={team.balance.hasHealth}>Un profil santé</StatusMarker>
                </li>
                <li>
                  <StatusMarker done={team.balance.hasTech}>Un profil tech</StatusMarker>
                </li>
              </ul>
              <p className="mt-4 font-semibold">
                {team.balance.complete ? (
                  <span className="text-emerald">Équipe complète et équilibrée.</span>
                ) : (
                  <span className="text-ink">Il manque {formatMissing(team.balance.missing)}.</span>
                )}
              </p>
            </section>
          </div>

          <div className="mt-8">
            {team.locked_at ? (
              <Alert tone="info" title="Équipe verrouillée par les organisateurs." />
            ) : !teamWindow.is_open ? (
              <Alert tone="info" title="Les équipes sont verrouillées.">
                Pour tout changement, écris aux organisateurs.
              </Alert>
            ) : teamWindow.closes_at ? (
              <p className="text-small text-graphite">
                Les équipes sont modifiables jusqu&apos;au <span className="font-semibold text-ink">{formatDeadline(teamWindow.closes_at)}</span>.
                Une équipe incomplète à cette date peut être fusionnée ou complétée par les organisateurs.
              </p>
            ) : null}
          </div>

          <section aria-labelledby="members-title" className="mt-12">
            <h2 id="members-title" className="t-subhead">
              Membres
            </h2>
            <ul className="mt-4 border-b border-jade/15">
              {team.members.map((m) => {
                const isLead = m.participation_id === team.lead_participation_id;
                const isMe = m.person_id === person.id;
                return (
                  <li key={m.participation_id} className="grid gap-3 border-t border-jade/15 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-semibold text-ink">
                        {m.first_name} {m.last_name}
                        {isMe && <span className="ml-2 font-normal text-graphite">(toi)</span>}
                      </p>
                      <p className="text-small text-graphite">
                        {disciplineLabel(m.discipline)} · {m.institution}
                        {isLead && <span className="ml-2 font-semibold text-jade">Chef d&apos;équipe</span>}
                        {m.person_status === "pending" && <span className="ml-2">· email non confirmé</span>}
                      </p>
                    </div>
                    {part.isLead && !isMe && editable && (
                      <div className="flex flex-wrap gap-2">
                        <SimpleActionForm action={manageMember.bind(null, c)} submitLabel="Nommer chef" variant="secondary" size="sm" pendingLabel="…">
                          <input type="hidden" name="participation_id" value={m.participation_id} />
                          <input type="hidden" name="op" value="lead" />
                        </SimpleActionForm>
                        <SimpleActionForm action={manageMember.bind(null, c)} submitLabel="Retirer" variant="secondary" size="sm" pendingLabel="…">
                          <input type="hidden" name="participation_id" value={m.participation_id} />
                          <input type="hidden" name="op" value="remove" />
                        </SimpleActionForm>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-small text-graphite">
              Un membre qui ne confirme pas son email sous 72 heures libère sa place.
            </p>
          </section>

          {editable && (
            <div className="mt-12 grid gap-10 border-t border-jade/15 pt-8 md:grid-cols-2">
              {part.isLead && (
                <section aria-labelledby="rename-title">
                  <h2 id="rename-title" className="t-subhead">
                    Renommer l&apos;équipe
                  </h2>
                  <div className="mt-4">
                    <SimpleActionForm action={renameTeam.bind(null, c)} submitLabel="Renommer" variant="secondary">
                      <div>
                        <label htmlFor="name" className="block font-semibold text-ink">
                          Nouveau nom
                        </label>
                        <input id="name" name="name" defaultValue={team.name} maxLength={40} className="control mt-2" />
                      </div>
                    </SimpleActionForm>
                  </div>
                </section>
              )}
              <section aria-labelledby="leave-title">
                <h2 id="leave-title" className="t-subhead">
                  Quitter l&apos;équipe
                </h2>
                <p className="mt-1 text-small text-graphite">
                  Tu restes inscrit·e au {info.label.toLowerCase()}, en recherche d&apos;équipe.
                  {part.isLead && " Le rôle de chef passe au membre le plus ancien."}
                </p>
                <div className="mt-4">
                  <SimpleActionForm action={leaveMyTeam.bind(null, c)} submitLabel="Quitter l'équipe" variant="secondary" />
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {part && (team ? editable : true) && (
        <section aria-labelledby="withdraw-title" className="mt-14 border-t border-jade/15 pt-8">
          <h2 id="withdraw-title" className="t-subhead">
            Ne plus participer à cette compétition
          </h2>
          <p className="mt-1 max-w-measure text-small text-graphite">
            Ton inscription à l&apos;autre compétition, s&apos;il y en a une, n&apos;est pas touchée.
          </p>
          <div className="mt-4">
            <SimpleActionForm action={withdrawCompetition.bind(null, c)} submitLabel="Me retirer" variant="danger" pendingLabel="…">
              <Checkbox name="confirm" id="withdraw_confirm">
                Je me retire du {info.label.toLowerCase()}.
              </Checkbox>
            </SimpleActionForm>
          </div>
        </section>
      )}
    </div>
  );
}
