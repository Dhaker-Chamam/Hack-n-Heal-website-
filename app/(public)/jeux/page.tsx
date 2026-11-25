import type { Metadata } from "next";
import { GameGrid } from "@/components/landing/games";
import { MotionProvider } from "@/components/landing/motion";
import { Upcoming } from "@/components/upcoming";

export const metadata: Metadata = { title: "Jeux" };

export default function GamesPage() {
  return (
    <Upcoming
      title="Jeux"
      intro="Cinq jeux d'échauffement à jouer tout de suite. Deux mini-jeux avec classement arrivent ensuite : traduire le code génétique et garder une glycémie dans la cible."
      opens="Codons et Glycémie 24 h : ouverture le lundi 30 novembre"
      facts={[
        ["Codons", "trouve l'acide aminé de chaque codon"],
        ["Glycémie 24 h", "reste entre 70 et 180 mg/dL"],
        ["Classement figé", "dimanche 6 décembre à 12:00"],
        ["Lots", "goodies pour les 3 premiers de chaque jeu"],
      ]}
      before={
        <section aria-labelledby="warmup-title" className="mx-auto max-w-6xl px-5 pt-12 md:pt-16">
          <h2 id="warmup-title" className="t-subhead">
            Jeux d&apos;échauffement
          </h2>
          <p className="mt-1 text-graphite">Cinq jeux courts, sans classement. Choisis-en un pour jouer.</p>
          <div className="mt-6">
            {/* the same games as on the landing page, with its reduced-motion setting */}
            <MotionProvider>
              <GameGrid />
            </MotionProvider>
          </div>
        </section>
      }
    >
      <h2 className="t-subhead">Codons et Glycémie 24 h, avec classement</h2>
      <p>
        À partir du lundi 30 novembre. Tout le monde peut jouer. Pour figurer au classement des lots, saisis ton code participant,
        visible dans ton espace.
      </p>
      <p>Glycémie 24 h est un jeu, pas un conseil médical.</p>
    </Upcoming>
  );
}
