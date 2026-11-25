import type { Metadata } from "next";
import Link from "next/link";
import { Prose, Section } from "@/components/prose";

export const metadata: Metadata = { title: "Règlement" };

export default function RulesPage() {
  return (
    <Prose title="Règlement de Hack'n'Heal 2026" updated="25 novembre 2026">
      <Section id="general" title="Participation">
        <ul>
          <li>Hack&apos;n&apos;Heal 2026 a lieu les samedi 5 et dimanche 6 décembre 2026 à l&apos;INSAT, Centre Urbain Nord, Tunis.</li>
          <li>La participation est gratuite et ouverte aux étudiant·e·s de 18 ans ou plus.</li>
          <li>On peut participer à une compétition ou aux deux, avec une équipe différente pour chacune.</li>
          <li>Chaque participant·e confirme son adresse email ; une inscription non confirmée sous 72 heures est supprimée.</li>
          <li>Les organisateurs peuvent refuser une inscription en double, fictive ou contraire à ce règlement.</li>
        </ul>
      </Section>

      <Section id="equipes" title="Équipes">
        <ul>
          <li>Hackathon médical : 4 à 7 membres. Hackathon bioinformatique : 2 à 4 membres.</li>
          <li>
            Chaque équipe réunit au moins un profil santé (médecine, pharmacie, biologie, chimie) et un profil tech (développement,
            IA et data). Une personne en bioinformatique, ou dont les spécialités relèvent des deux côtés, compte pour l&apos;un ou
            l&apos;autre, mais pas pour les deux à elle seule.
          </li>
          <li>Les équipes médicales sont verrouillées le vendredi 27 novembre à 23:59, les équipes bioinformatiques le mercredi 2 décembre à 23:59.</li>
          <li>À la clôture, les organisateurs peuvent compléter, fusionner ou recomposer les équipes incomplètes et y placer les participant·e·s sans équipe.</li>
        </ul>
      </Section>

      <Section id="medical" title="Hackathon médical">
        <ul>
          <li>Le défi est publié le samedi 28 novembre à 10:00 sur la page Défi médical, avec ses ressources.</li>
          <li>
            Chaque équipe dépose son projet depuis l&apos;espace d&apos;un de ses membres avant le <strong>jeudi 3 décembre à 23:59</strong> :
            titre, résumé, axe, sources de données et une <strong>vidéo de 5 minutes maximum</strong> (lien YouTube non répertorié,
            Google Drive ou Vimeo). L&apos;heure du serveur fait foi.
          </li>
          <li>Une équipe sans dépôt ne présente pas son pitch.</li>
          <li>Le dimanche 6 décembre, chaque équipe présente son projet devant le jury à l&apos;INSAT : 5 minutes de pitch puis 3 minutes de questions, sauf annonce contraire.</li>
          <li>
            Grille du jury : pertinence médicale (25 %), qualité du prototype (25 %), innovation (20 %), données et éthique (15 %),
            pitch et vidéo (15 %). En cas d&apos;égalité, la pertinence médicale départage, puis la délibération du jury.
          </li>
        </ul>
      </Section>

      <Section id="bioinfo" title="Hackathon bioinformatique">
        <ul>
          <li>La compétition se déroule sur Kaggle pendant 12 heures, le samedi 5 décembre, à l&apos;INSAT.</li>
          <li>Le lien de la compétition est dévoilé au lancement sur la page Bioinformatique. Le nom de l&apos;équipe sur Kaggle doit être celui de l&apos;équipe inscrite.</li>
          <li>La date de fin et le classement sont ceux de Kaggle (classement privé). Chaque participant·e apporte son ordinateur portable.</li>
        </ul>
      </Section>

      <Section id="donnees" title="Données et éthique">
        <ul>
          <li>Aucune donnée de patient identifiable, aucune image médicale ou cas reconnaissable ne doit être utilisée ni publiée.</li>
          <li>Les jeux de données utilisés sont cités avec leur licence.</li>
          <li>Un projet présenté comme un outil de diagnostic ou de traitement doit indiquer ses limites ; aucune promesse de guérison.</li>
        </ul>
      </Section>

      <Section id="the-wall" title="The Wall">
        <ul>
          <li>
            The Wall est l&apos;espace de publication en ligne de l&apos;événement. Chaque participant·e confirmé·e peut y publier
            jusqu&apos;à 3 messages (projet, idée ou réflexion, 800 caractères, un lien facultatif, pas d&apos;image) jusqu&apos;au
            mercredi 2 décembre à 23:59.
          </li>
          <li>Chaque message est relu par un modérateur avant publication. Sont refusés : données de patients, affirmations médicales sans source, promesses de guérison, publicité, harcèlement.</li>
          <li>
            Tout le monde peut aimer un message, une fois par message et par navigateur, jusqu&apos;au{" "}
            <strong>jeudi 3 décembre à 20:00</strong>. Chaque message peut être signalé ; au bout de 3 signalements, il est masqué
            jusqu&apos;à sa relecture.
          </li>
          <li>
            L&apos;auteur·e du message le plus aimé obtient 3 minutes sur scène le dimanche, avant la remise des prix. Les organisateurs
            vérifient les votes : les mentions « j&apos;aime » frauduleuses (comptes multiples, scripts, achats) sont annulées et
            peuvent entraîner la disqualification.
          </li>
          <li>En cas d&apos;égalité, le message qui a atteint son total en premier l&apos;emporte. Le gagnant est annoncé le vendredi 4 décembre et confirme sa présence avant le samedi 5 décembre à 12:00, sans quoi la place revient au suivant.</li>
        </ul>
      </Section>

      <Section id="jeux" title="Mini-jeux">
        <ul>
          <li>Les mini-jeux sont ouverts à tous. Pour figurer au classement des lots, saisis ton code participant.</li>
          <li>Seul le meilleur score de chaque joueur compte ; les classements sont figés le dimanche 6 décembre à 12:00.</li>
          <li>Les trois premiers de chaque jeu reçoivent des goodies. Les jeux n&apos;ont aucun effet sur les compétitions ni sur The Wall.</li>
          <li>Les scores obtenus par triche ou par modification du jeu sont supprimés.</li>
        </ul>
      </Section>

      <Section id="conduite" title="Conduite et image">
        <ul>
          <li>Respect des autres participant·e·s, des mentors, du jury, des bénévoles et des locaux de l&apos;INSAT.</li>
          <li>L&apos;événement est photographié et filmé. Si tu ne veux pas apparaître, coche la case prévue dans ton espace : un repère sur ton badge le signale aux photographes.</li>
          <li>
            Le traitement des données personnelles est décrit dans la{" "}
            <Link href="/confidentialite" className="font-semibold text-emerald underline">
              politique de données personnelles
            </Link>
            .
          </li>
        </ul>
      </Section>
    </Prose>
  );
}
