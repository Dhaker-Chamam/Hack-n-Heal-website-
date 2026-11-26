import type { Metadata } from "next";
import { Upcoming } from "@/components/upcoming";

export const metadata: Metadata = { title: "Défi médical" };

export default function ChallengePage() {
  return (
    <Upcoming
      title="Défi médical"
      intro="Une semaine pour répondre à un défi clinique réel sur le cancer ou les maladies auto-immunes, en équipe de 4 à 7, avec un pitch final devant le jury à l'INSAT."
      opens="Défi publié le mercredi 25 novembre"
      facts={[
        ["Publication du défi", "mercredi 25 novembre"],
        ["Inscriptions", "jusqu'au vendredi 27 novembre à 22:00"],
        ["Dépôt du projet", "jusqu'au jeudi 3 décembre à 23:59"],
        ["Livrable", "vidéo de 5 minutes maximum"],
        ["Pitch devant le jury", "samedi 5 décembre, INSAT"],
      ]}
    >
      <p>
        Le défi est rédigé avec des praticiens et un partenaire de l&apos;événement. Il est publié le mercredi 25 novembre avec
        ses ressources : jeux de données ouverts, contexte clinique, contraintes.
      </p>
      <p>
        Chaque équipe dépose son projet depuis l&apos;espace d&apos;un de ses membres : titre, résumé, axe, sources de données et le
        lien d&apos;une vidéo de 5 minutes maximum. Le samedi 5 décembre, l&apos;équipe présente son projet devant le jury.
      </p>
      <p>
        Les inscriptions au hackathon médical ferment le vendredi 27 novembre à 22:00. Les équipes médicales sont verrouillées le même
        jour à 23:59.
      </p>
    </Upcoming>
  );
}
