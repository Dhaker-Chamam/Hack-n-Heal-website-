import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { ProfileForm } from "@/components/forms/profile-form";
import { SimpleActionForm } from "@/components/forms/simple-action-form";
import { PageHero } from "@/components/page-hero";
import { LinkRequestForm } from "@/components/link-request-form";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { Squares, StatusMarker } from "@/components/ui/markers";
import { COMPETITIONS, INSTITUTIONS, SKILLS, SPECIALITIES, STUDY_LEVELS, type Competition } from "@/lib/constants";
import { cvUploadEnabled } from "@/lib/env";
import { myParticipations, type MyParticipation } from "@/lib/participant";
import { qrPayload, qrSvg } from "@/lib/qr";
import { currentPerson } from "@/lib/session";
import { formatMissing } from "@/lib/teams";
import { formatDeadline, formatShort } from "@/lib/time";
import { getWindows, isPaused, type TimeWindow } from "@/lib/windows";
import { requestLink } from "../lien/actions";
import { deleteMyData, removeCv, replaceCv, signOut, updatePreferences, updateProfile } from "./actions";

export const metadata: Metadata = { title: "Mon espace" };

export default async function MePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const person = await currentPerson();
  if (!person || person.status === "rejected") return <SignedOut />;

  const [{ bienvenue }, parts, windows, svg] = await Promise.all([
    searchParams,
    myParticipations(person.id),
    getWindows(),
    qrSvg(qrPayload(person.id)),
  ]);
  const cancelled = person.status === "cancelled";
  // false for an author of The Wall who takes part in no hackathon: no QR code, no team question
  const inHackathon = Object.keys(parts).length > 0;

  return (
    <>
      <PageHero size="headline" title={`Bonjour ${person.first_name}`}>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <p className="text-mist/80">
            {person.first_name} {person.last_name} · {person.institution}
          </p>
          <form action={signOut}>
            <button type="submit" className="py-2 text-small font-semibold text-mist underline decoration-luminous underline-offset-4 hover:text-luminous">
              Se déconnecter de cet appareil
            </button>
          </form>
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        {bienvenue && (
          <div className="mb-10">
            <Alert tone="success" title="Ton inscription est confirmée.">
              Ton QR code d&apos;accueil vient de t&apos;être envoyé par email. Il est aussi disponible ici.
            </Alert>
          </div>
        )}
        {cancelled && (
          <div className="mb-10">
            <Alert tone="error" title="Ton inscription a été annulée par les organisateurs.">
              Écris-leur si tu penses qu&apos;il s&apos;agit d&apos;une erreur.
            </Alert>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <section aria-labelledby="comp-title" className="min-w-0">
            <h2 id="comp-title" className="t-subhead">
              Mes compétitions
            </h2>
            <div className="mt-4 grid gap-4">
              {(["medical", "bioinfo"] as Competition[]).map((c) => (
                <CompetitionRow key={c} c={c} part={parts[c]} reg={windows[COMPETITIONS[c].regWindow as "reg_medical"]} team={windows[COMPETITIONS[c].teamWindow as "teams_medical"]} />
              ))}
            </div>
          </section>

          {inHackathon ? (
          <section aria-labelledby="qr-title" className="lg:row-span-2">
            <h2 id="qr-title" className="t-subhead">
              Mon QR code d&apos;accueil
            </h2>
            <div className="mt-4 border border-jade/15 bg-white p-5">
              <div
                className="mx-auto aspect-square w-full max-w-60 [&_svg]:h-auto [&_svg]:w-full"
                role="img"
                aria-label={`QR code d'accueil de ${person.first_name} ${person.last_name}`}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <dl className="mt-4 border-t border-jade/15 pt-3">
                <dt className="t-label text-graphite">Code participant</dt>
                <dd className="tabular mt-1 text-lg font-semibold tracking-[0.06em] text-ink">{person.participant_code}</dd>
              </dl>
              <p className="mt-3 text-small text-graphite">
                À présenter à l&apos;accueil de l&apos;INSAT le samedi 5 décembre, sur ton téléphone ou imprimé.
              </p>
              <a href="/moi/qr" download className={buttonClass("secondary", "sm", "mt-4 w-full")}>
                <Download aria-hidden className="size-4" strokeWidth={1.75} /> Télécharger le QR code
              </a>
            </div>
          </section>
          ) : (
            <section aria-labelledby="wall-title" className="lg:row-span-2">
              <h2 id="wall-title" className="t-subhead">
                The Wall
              </h2>
              <div className="mt-4 border border-jade/15 bg-white p-5">
                <p className="text-ink">Tu peux publier sur The Wall sans participer à un hackathon.</p>
                <Link href="/the-wall/publier" className={buttonClass("secondary", "sm", "mt-4 w-full")}>
                  Publier ou voir mes messages
                </Link>
              </div>
            </section>
          )}

          <div className="grid min-w-0 gap-14">
            <section aria-labelledby="profile-title" className="border-t border-jade/15 pt-8">
              <h2 id="profile-title" className="t-subhead">
                Mon profil
              </h2>
              <p className="mt-1 text-small text-graphite">
                Email : <span className="font-semibold text-ink">{person.email}</span>. Pour le changer, écris aux organisateurs.
              </p>
              <div className="mt-6">
                <ProfileForm
                  action={updateProfile}
                  defaults={{
                    first_name: person.first_name,
                    last_name: person.last_name,
                    phone: person.phone ?? "",
                    institution: person.institution,
                    study_level: person.study_level ?? "",
                    specialities: person.specialities,
                    skills: person.skills,
                    link_url: person.link_url ?? "",
                    facebook: person.facebook ?? "",
                  }}
                  institutions={INSTITUTIONS}
                  levels={STUDY_LEVELS}
                  specialities={SPECIALITIES}
                  skills={SKILLS}
                />
              </div>
            </section>

            <section aria-labelledby="consent-title" className="border-t border-jade/15 pt-8">
              <h2 id="consent-title" className="t-subhead">
                CV et autorisations
              </h2>
              {cvUploadEnabled() ? (
                <div className="mt-4 grid gap-4">
                  {person.cv_path ? (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <StatusMarker done>
                        CV enregistré{person.cv_uploaded_at ? ` le ${formatShort(person.cv_uploaded_at)}` : ""}
                      </StatusMarker>
                      <form action={removeCv}>
                        <button type="submit" className="text-small font-semibold text-danger underline underline-offset-4">
                          Supprimer mon CV
                        </button>
                      </form>
                    </div>
                  ) : (
                    <StatusMarker done={false}>Aucun CV enregistré</StatusMarker>
                  )}
                  <SimpleActionForm action={replaceCv} submitLabel={person.cv_path ? "Remplacer le CV" : "Envoyer le CV"} variant="secondary" size="sm" inline>
                    <div className="min-w-0 flex-1">
                      <label htmlFor="cv" className="block font-semibold text-ink">
                        Fichier PDF <span className="ml-1 font-normal text-small text-graphite">3 Mo maximum</span>
                      </label>
                      <input
                        id="cv"
                        name="cv"
                        type="file"
                        accept="application/pdf,.pdf"
                        className="mt-2 block w-full text-small text-graphite file:mr-4 file:min-h-10 file:cursor-pointer file:rounded-[var(--radius-ctl)] file:border file:border-jade file:bg-white file:px-4 file:font-semibold file:text-jade hover:file:bg-mist"
                      />
                    </div>
                  </SimpleActionForm>
                </div>
              ) : (
                <p className="mt-2 text-small text-graphite">L&apos;envoi de CV ouvrira bientôt.</p>
              )}
              <div className="mt-8">
                <SimpleActionForm action={updatePreferences} submitLabel="Enregistrer mes choix" variant="secondary">
                  <div className="grid gap-1">
                    {cvUploadEnabled() && (
                      <Checkbox name="cv_share" id="pref_cv_share" defaultChecked={person.cv_share_opt_in} disabled={!person.cv_path}>
                        Transmettre mon CV au partenaire officiel de Hack&apos;n&apos;Heal 2026.
                      </Checkbox>
                    )}
                    <Checkbox name="internship" id="pref_internship" defaultChecked={person.internship_offers_opt_in}>
                      Recevoir les offres de stage des partenaires.
                    </Checkbox>
                    <Checkbox name="photo_opt_out" id="pref_photo" defaultChecked={person.photo_opt_out}>
                      Ne pas apparaître sur les photos et vidéos de l&apos;événement.
                    </Checkbox>
                    {inHackathon && (
                      <fieldset className="mt-4">
                        <legend className="font-semibold text-ink">Acceptes-tu de faire partie d&apos;une équipe mixte ?</legend>
                        <p className="mt-0.5 text-small text-graphite">Une équipe mixte réunit des profils santé et tech : médecine, pharmacie, biologie, informatique, IA et data…</p>
                        <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1">
                          {(
                            [
                              ["oui", "Oui", true],
                              ["non", "Non", false],
                            ] as const
                          ).map(([value, label, answer]) => (
                            <label key={value} className="flex cursor-pointer items-center gap-2.5 py-1 text-ink">
                              <input type="radio" name="mixed_team" value={value} defaultChecked={person.mixed_team_ok === answer} className="size-5 cursor-pointer" />
                              {label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    )}
                  </div>
                </SimpleActionForm>
              </div>
            </section>

            <section aria-labelledby="data-title" className="border-t border-jade/15 pt-8">
              <h2 id="data-title" className="t-subhead">
                Mes données
              </h2>
              <p className="mt-2 max-w-measure text-graphite">
                Tu peux supprimer ton inscription à tout moment : profil, équipes, CV et publications sur The Wall sont effacés
                immédiatement. Cette action est définitive. Voir la{" "}
                <Link href="/confidentialite" className="font-semibold text-emerald underline">
                  politique de données personnelles
                </Link>
                .
              </p>
              <div className="mt-5">
                <SimpleActionForm action={deleteMyData} submitLabel="Supprimer mon inscription" pendingLabel="Suppression…" variant="danger">
                  <Checkbox name="confirm" id="delete_confirm">
                    Je comprends que mon inscription et mes données seront supprimées définitivement.
                  </Checkbox>
                </SimpleActionForm>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function CompetitionRow({
  c,
  part,
  reg,
  team: teamWindow,
}: {
  c: Competition;
  part?: MyParticipation;
  reg: TimeWindow;
  team: TimeWindow;
}) {
  const info = COMPETITIONS[c];
  const mark = (
    <span aria-hidden className={`mr-2.5 inline-block size-3 align-[0.05em] ${c === "medical" ? "bg-jade" : "bg-emerald"}`} />
  );

  if (!part) {
    return (
      <div className="border border-jade/15 bg-white p-5">
        <p className="font-semibold text-ink">
          {mark}
          {info.label} <span className="ml-2 font-normal text-graphite">{info.rhythm}</span>
        </p>
        {reg.is_open ? (
          <>
            <p className="mt-1 text-small text-graphite">
              Tu n&apos;y participes pas encore. Inscriptions ouvertes jusqu&apos;au {reg.closes_at ? formatDeadline(reg.closes_at) : "la veille"}.
            </p>
            <Link href={`/moi/equipe/${c}`} className="mt-3 inline-flex items-center gap-1.5 font-semibold text-emerald underline underline-offset-4">
              Participer aussi <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
            </Link>
          </>
        ) : (
          <p className="mt-1 text-small text-graphite">
            Tu n&apos;y participes pas. Les inscriptions sont {isPaused(reg) ? "fermées pour le moment" : "closes"}.
          </p>
        )}
      </div>
    );
  }

  const t = part.team;
  return (
    <div className="border border-jade/15 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="font-semibold text-ink">
          {mark}
          {info.label} <span className="ml-2 font-normal text-graphite">{info.rhythm}</span>
        </p>
        {t?.locked_at || !teamWindow.is_open ? (
          <span className="text-small font-semibold text-jade">
            {!t?.locked_at && isPaused(teamWindow) ? "Équipes fermées pour le moment" : "Équipe verrouillée"}
          </span>
        ) : teamWindow.closes_at ? (
          <span className="text-small text-graphite">Équipes modifiables jusqu&apos;au {formatDeadline(teamWindow.closes_at)}</span>
        ) : null}
      </div>
      {t ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="t-subhead text-jade">{t.name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-graphite">
              <Squares filled={t.balance.size} total={info.max} label={`${t.balance.size} membres sur ${info.max}`} />
              <span className="tabular">
                {t.balance.size}/{info.max} membres · code <span className="font-semibold text-ink">{t.join_code}</span>
              </span>
            </div>
            <p className="mt-2 text-small">
              {t.balance.complete ? (
                <span className="font-semibold text-emerald">Équipe complète et équilibrée</span>
              ) : (
                <span className="text-ink">Il manque {formatMissing(t.balance.missing)}.</span>
              )}
            </p>
          </div>
          <Link href={`/moi/equipe/${c}`} className={buttonClass("secondary", "sm")}>
            {part.isLead ? "Gérer l'équipe" : "Voir l'équipe"}
          </Link>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <p className="text-ink">
            {part.seeking_team
              ? "Tu cherches une équipe. Les organisateurs te placeront, ou crée et rejoins une équipe toi-même."
              : "Tu n'as pas encore d'équipe."}
          </p>
          {teamWindow.is_open && (
            <Link href={`/moi/equipe/${c}`} className={buttonClass("secondary", "sm")}>
              Trouver une équipe
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function SignedOut() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:py-20">
      <h1 className="t-headline">Mon espace</h1>
      <p className="mt-4 max-w-measure text-ink">
        Ton espace s&apos;ouvre avec le lien personnel reçu par email après ton inscription. Saisis ton adresse pour en
        recevoir un nouveau.
      </p>
      <div className="mt-8">
        <LinkRequestForm action={requestLink} />
      </div>
      <p className="mt-12 border-t border-jade/15 pt-6 text-graphite">
        Pas encore inscrit·e ?{" "}
        <Link href="/inscription" className="font-semibold text-emerald underline">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}
