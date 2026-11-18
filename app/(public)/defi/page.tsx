import type { Metadata } from "next";
import { Upcoming } from "@/components/upcoming";

export const metadata: Metadata = { title: "Défi médical" };

export default function ChallengePage() {
  return (
    <Upcoming
      title="Défi médical"
      intro="Une semaine pour répondre à un défi clinique réel sur le cancer ou les maladies auto-immunes, en équipe de 4 à 7, avec un pitch final devant le jury à l'INSAT."
      opens="Publication le samedi 28 novembre à 10:00"
      facts={[
        ["Publication du défi", "samedi 28 novembre à 10:00"],
        ["Dépôt du projet", "jusqu'au jeudi 3 décembre à 23:59"],
        ["Livrable", "vidéo de 5 minutes maximum"],
        ["Pitch devant le jury", "dimanche 6 décembre, INSAT"],
      ]}
    >
      <p>
        Le défi est rédigé avec des praticiens et un partenaire de l&apos;événement. Il sera publié ici avec ses ressources :
        jeux de données ouverts, contexte clinique, contraintes.
      </p>
      <p>
        Chaque équipe dépose son projet depuis l&apos;espace d&apos;un de ses membres : titre, résumé, axe, sources de données et le
        lien d&apos;une vidéo de 5 minutes maximum. Le dimanche, l&apos;équipe présente son projet devant le jury.
      </p>
      <p>Les équipes médicales sont verrouillées le vendredi 27 novembre à 23:59, la veille de la publication.</p>
    </Upcoming>
  );
}
