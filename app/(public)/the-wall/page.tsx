import type { Metadata } from "next";
import { Upcoming } from "@/components/upcoming";

export const metadata: Metadata = { title: "The Wall" };

export default function TheWallPage() {
  return (
    <Upcoming
      title="The Wall"
      intro="L'espace où les participants partagent leurs projets et leurs idées avant l'événement. Le message le plus aimé gagne 3 minutes sur scène, le dimanche."
      opens="Ouverture le vendredi 20 novembre"
      facts={[
        ["Publications", "jusqu'au mercredi 2 décembre à 23:59"],
        ["Votes", "jusqu'au jeudi 3 décembre à 20:00"],
        ["Qui publie", "les participants confirmés, 3 messages chacun"],
        ["Qui vote", "tout le monde, sans compte"],
      ]}
    >
      <p>
        Chaque message est relu avant publication. Pas d&apos;image, pas de données de patient, pas d&apos;affirmation médicale sans
        source.
      </p>
      <p>Les votes sont vérifiés par les organisateurs avant l&apos;annonce du gagnant, le vendredi 4 décembre.</p>
    </Upcoming>
  );
}
