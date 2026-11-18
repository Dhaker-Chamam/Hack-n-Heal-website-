import type { Metadata } from "next";
import Link from "next/link";
import { Upcoming } from "@/components/upcoming";

export const metadata: Metadata = { title: "Jeux" };

export default function GamesPage() {
  return (
    <Upcoming
      title="Jeux"
      intro="Deux mini-jeux d'une minute pour patienter jusqu'au jour J : traduire le code génétique et garder une glycémie dans la cible."
      opens="Ouverture le lundi 30 novembre"
      facts={[
        ["Codons", "trouve l'acide aminé de chaque codon"],
        ["Glycémie 24 h", "reste entre 70 et 180 mg/dL"],
        ["Classement figé", "dimanche 6 décembre à 12:00"],
        ["Lots", "goodies pour les 3 premiers de chaque jeu"],
      ]}
    >
      <p>Tout le monde peut jouer. Pour figurer au classement des lots, saisis ton code participant, visible dans ton espace.</p>
      <p>Glycémie 24 h est un jeu, pas un conseil médical.</p>
      <p>
        En attendant, quatre jeux d&apos;échauffement t&apos;attendent sur la{" "}
        <Link href="/#jeux" className="font-semibold text-emerald underline">
          page d&apos;accueil
        </Link>
        .
      </p>
    </Upcoming>
  );
}
