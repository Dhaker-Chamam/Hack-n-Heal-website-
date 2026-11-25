import type { Metadata } from "next";
import { Upcoming } from "@/components/upcoming";
import { formatDeadline } from "@/lib/time";
import { getWindow, isPaused } from "@/lib/windows";

export const metadata: Metadata = { title: "Hackathon bioinformatique" };

export default async function BioinfoPage() {
  const reg = await getWindow("reg_bioinfo");
  const registration = reg.is_open
    ? reg.closes_at
      ? `jusqu'au ${formatDeadline(reg.closes_at)}`
      : "ouvertes"
    : isPaused(reg)
      ? "fermées pour le moment"
      : "closes";
  return (
    <Upcoming
      title="Hackathon bioinformatique"
      intro="Douze heures d'analyse de données biologiques sur Kaggle, en équipe de 2 à 4, le samedi 5 décembre à l'INSAT."
      opens="Lancement le samedi 5 décembre à l'INSAT"
      facts={[
        ["Inscriptions et équipes", registration],
        ["Durée", "12 heures"],
        ["Plateforme", "Kaggle"],
        ["Matériel", "ton ordinateur portable"],
      ]}
    >
      <p>
        Le sujet et le lien de la compétition Kaggle seront dévoilés sur cette page au lancement. La fin de la compétition et
        le classement sont ceux de Kaggle.
      </p>
      <p>
        Avant le jour J : crée ton compte sur kaggle.com, vérifie-le avec ton numéro de téléphone, et donne à ton équipe Kaggle
        le même nom que ton équipe inscrite ici.
      </p>
    </Upcoming>
  );
}
