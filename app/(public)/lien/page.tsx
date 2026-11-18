import type { Metadata } from "next";
import Link from "next/link";
import { LinkRequestForm } from "@/components/link-request-form";
import { Alert } from "@/components/ui/alert";
import { requestLink } from "./actions";

export const metadata: Metadata = { title: "Recevoir mon lien personnel", robots: { index: false } };

const REASONS: Record<string, string> = {
  invalide: "Ce lien n'est plus valable. Un lien est remplacé chaque fois qu'un nouveau est demandé.",
  limite: "Trop de tentatives depuis cette connexion. Réessaie dans quelques minutes.",
  refusee: "Cette inscription a été refusée par les organisateurs. Écris-leur si tu penses qu'il s'agit d'une erreur.",
  session: "Ouvre ton espace avec ton lien personnel pour continuer.",
};

export default async function LinkPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { raison } = await searchParams;
  const reason = raison ? REASONS[raison] : undefined;
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:py-20">
      <h1 className="t-headline">Recevoir mon lien personnel</h1>
      <p className="mt-4 max-w-measure text-ink">
        Il n&apos;y a pas de mot de passe : ton espace s&apos;ouvre avec un lien personnel envoyé par email. Saisis
        l&apos;adresse utilisée à l&apos;inscription pour en recevoir un nouveau.
      </p>
      {reason && (
        <div className="mt-6">
          <Alert tone={raison === "session" ? "info" : "error"} title={reason} />
        </div>
      )}
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
