import type { Metadata } from "next";
import Link from "next/link";
import { Prose, Section } from "@/components/prose";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Données personnelles" };

export default function PrivacyPage() {
  const contact = env.controllerContact ?? "symbioinsat@gmail.com";
  return (
    <Prose title="Données personnelles" updated="16 novembre 2026">
      <Section id="responsable" title="Qui traite tes données">
        <p>
          Le responsable du traitement est <strong>{env.controllerName}</strong>, club étudiant de l&apos;INSAT, qui organise
          Hack&apos;n&apos;Heal 2026 avec INSAT Android Club. Contact pour toute question ou demande :{" "}
          <a href={`mailto:${contact}`} className="font-semibold text-emerald underline">
            {contact}
          </a>
          .
        </p>
        <p>
          Ce traitement respecte la loi organique n° 2004-63 du 27 juillet 2004 portant sur la protection des données à
          caractère personnel. Il fait l&apos;objet d&apos;une déclaration auprès de l&apos;Instance nationale de protection des
          données personnelles (INPDP).
        </p>
      </Section>

      <Section id="donnees" title="Ce que nous collectons, et pourquoi">
        <ul>
          <li>
            <strong>Identité et contact</strong> (prénom, nom, email, téléphone) : gérer ton inscription, t&apos;envoyer ton lien
            personnel et ton QR code, te joindre pendant l&apos;événement, imprimer ton badge et ton certificat.
          </li>
          <li>
            <strong>Parcours</strong> (établissement, niveau, profil, compétences, lien LinkedIn ou GitHub) : former des équipes
            équilibrées entre santé et tech.
          </li>
          <li>
            <strong>Participation</strong> (équipe, nom d&apos;utilisateur Kaggle, projet déposé, notes du jury, passage à
            l&apos;accueil) : organiser les compétitions, classer les équipes, délivrer les certificats.
          </li>
          <li>
            <strong>CV</strong>, seulement si tu l&apos;envoies : il n&apos;est transmis au partenaire officiel que si tu as coché la
            case correspondante, et tu peux retirer ton accord tant qu&apos;il n&apos;a pas été transmis.
          </li>
          <li>
            <strong>The Wall et mini-jeux</strong> : tes publications, avec ton prénom, l&apos;initiale de ton nom et ton
            établissement ; tes scores si tu saisis ton code participant.
          </li>
          <li>
            <strong>Données techniques</strong> : adresse IP et empreinte de navigateur, uniquement sous forme chiffrée
            (empreinte salée) pour limiter les abus sur les votes, les jeux et les formulaires. Aucune adresse IP n&apos;est
            conservée en clair.
          </li>
        </ul>
        <p>
          Nous ne collectons ni date de naissance, ni numéro d&apos;identité, ni adresse, ni aucune donnée de santé. Pour un
          besoin alimentaire ou d&apos;accessibilité, écris directement aux organisateurs.
        </p>
      </Section>

      <Section id="base" title="Sur quelle base">
        <p>
          Ton consentement, donné à l&apos;inscription et enregistré avec la date et la version du texte affiché. Chaque
          autorisation facultative (CV, offres de stage, photos) est séparée et modifiable à tout moment dans{" "}
          <Link href="/moi" className="font-semibold text-emerald underline">
            ton espace
          </Link>
          .
        </p>
      </Section>

      <Section id="destinataires" title="Qui y a accès">
        <ul>
          <li>Les organisateurs habilités de Symbio INSAT et d&apos;INSAT Android Club, selon leur rôle (accueil, modération, administration).</li>
          <li>Les membres du jury et les mentors, pour le seul projet de ton équipe : nom de l&apos;équipe, projet, prénoms des membres.</li>
          <li>Le partenaire officiel, pour ton CV, uniquement si tu l&apos;as autorisé.</li>
          <li>Nos prestataires techniques, qui agissent sur nos instructions : hébergement du site et de la base de données (Vercel, Supabase).</li>
        </ul>
        <p>Tes données ne sont ni vendues ni utilisées à des fins publicitaires.</p>
      </Section>

      <Section id="transfert" title="Hébergement hors de Tunisie">
        <p>
          La base de données est hébergée dans l&apos;Union européenne (Irlande). Ce transfert est déclaré à l&apos;INPDP et soumis à
          son autorisation, conformément aux articles 50 et suivants de la loi organique n° 2004-63.
        </p>
      </Section>

      <Section id="duree" title="Combien de temps">
        <ul>
          <li>Inscription non confirmée : supprimée au bout de 72 heures.</li>
          <li>Empreintes techniques des votes et des jeux : supprimées 30 jours après la désignation du gagnant de The Wall.</li>
          <li>Numéros de téléphone : supprimés le 31 décembre 2026.</li>
          <li>CV : supprimés le 6 mars 2027 au plus tard.</li>
          <li>Autres données de participation : anonymisées le 6 juin 2027.</li>
          <li>Registre des certificats (nom, compétition, classement) : conservé pour pouvoir réémettre un certificat.</li>
        </ul>
      </Section>

      <Section id="droits" title="Tes droits">
        <p>
          Tu peux à tout moment accéder à tes données, les corriger, t&apos;opposer à un traitement, retirer un consentement ou
          supprimer ton inscription. La plupart de ces actions se font directement depuis{" "}
          <Link href="/moi" className="font-semibold text-emerald underline">
            ton espace
          </Link>
          . Pour le reste, écris à{" "}
          <a href={`mailto:${contact}`} className="font-semibold text-emerald underline">
            {contact}
          </a>
          ; nous répondons sous un mois. Tu peux aussi saisir l&apos;INPDP.
        </p>
      </Section>

      <Section id="securite" title="Sécurité">
        <p>
          Pas de mot de passe : ton espace s&apos;ouvre avec un lien personnel que nous ne conservons que sous forme chiffrée.
          Ne le partage pas. Les CV sont stockés dans un espace privé, consultable uniquement par les organisateurs habilités
          via des liens temporaires. Le QR code d&apos;accueil ne contient aucune donnée personnelle lisible.
        </p>
      </Section>
    </Prose>
  );
}
