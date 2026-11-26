import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { RegistrationForm } from "@/components/registration-form";
import { Alert } from "@/components/ui/alert";
import { Facts } from "@/components/ui/facts";
import { INSTITUTIONS, SKILLS, SPECIALITIES, STUDY_LEVELS } from "@/lib/constants";
import { cvUploadEnabled } from "@/lib/env";
import { currentPerson } from "@/lib/session";
import { formatDeadline } from "@/lib/time";
import { getWindows, isPaused } from "@/lib/windows";
import { register } from "./actions";

export const metadata: Metadata = { title: "Inscription" };

export default async function InscriptionPage() {
  const [w, person] = await Promise.all([getWindows(), currentPerson()]);
  const deadline = (d: Date | null) => (d ? formatDeadline(d) : "la veille de l'événement");

  return (
    <>
      <PageHero title={<>S&apos;inscrire à Hack&apos;n&apos;Heal 2026</>}>
        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-mist/80">
          <li>
            <span className="font-semibold text-luminous">5 et 6 décembre 2026</span>
          </li>
          <li>INSAT, Centre Urbain Nord, Tunis</li>
          <li>Gratuit, ouvert aux étudiants</li>
        </ul>
      </PageHero>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
        <div className="min-w-0">
          {person && (
            <div className="mb-8">
              <Alert tone="info" title={`Tu es déjà inscrit·e, ${person.first_name}.`}>
                <Link href="/moi" className="font-semibold text-emerald underline">
                  Ouvrir mon espace
                </Link>{" "}
                pour gérer ton équipe ou rejoindre la deuxième compétition.
              </Alert>
            </div>
          )}
          <RegistrationForm
            action={register}
            open={{ medical: w.reg_medical.is_open, bioinfo: w.reg_bioinfo.is_open }}
            paused={{ medical: isPaused(w.reg_medical), bioinfo: isPaused(w.reg_bioinfo) }}
            deadlines={{ medical: deadline(w.reg_medical.closes_at), bioinfo: deadline(w.reg_bioinfo.closes_at) }}
            cvEnabled={cvUploadEnabled()}
            institutions={INSTITUTIONS}
            levels={STUDY_LEVELS}
            specialities={SPECIALITIES}
            skills={SKILLS}
          />
        </div>

        <aside aria-labelledby="dates-title" className="lg:pt-1">
          <h2 id="dates-title" className="t-subhead">
            Dates à retenir
          </h2>
          <div className="mt-4">
            <Facts
              items={[
                ["Inscriptions, médical", isPaused(w.reg_medical) ? "fermées pour le moment" : deadline(w.reg_medical.closes_at)],
                ["Équipes médicales verrouillées", deadline(w.teams_medical.closes_at)],
                ["Défi médical publié", "mercredi 25 novembre"],
                ["Inscriptions, bioinformatique", isPaused(w.reg_bioinfo) ? "fermées pour le moment" : deadline(w.reg_bioinfo.closes_at)],
                ["Événement à l'INSAT", "samedi 5 et dimanche 6 décembre"],
              ]}
            />
          </div>
          <p className="mt-6 border-t border-jade/15 pt-4 text-small text-graphite">
            Déjà inscrit·e mais sans ton email ?{" "}
            <Link href="/lien" className="font-semibold text-emerald underline">
              Recevoir mon lien personnel
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
