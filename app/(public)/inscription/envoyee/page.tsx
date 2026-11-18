import type { Metadata } from "next";
import Link from "next/link";
import { ClearDraft } from "@/components/clear-draft";
import { Alert } from "@/components/ui/alert";
import { StatusMarker } from "@/components/ui/markers";

export const metadata: Metadata = { title: "Vérifie ta boîte mail", robots: { index: false } };

export default async function SentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { e, cv } = await searchParams;
  const masked = e && /^[^<>]{3,170}$/.test(e) ? e : null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:py-20">
      <ClearDraft />
      <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-small text-graphite" aria-label="Avancement">
        <li>
          <StatusMarker done>Formulaire envoyé</StatusMarker>
        </li>
        <li>
          <StatusMarker done={false}>Adresse confirmée</StatusMarker>
        </li>
      </ol>
      <h1 className="t-headline">Vérifie ta boîte mail</h1>
      <p className="mt-4 text-lg text-ink">
        Nous avons envoyé un lien de confirmation{masked ? <> à <span className="font-semibold">{masked}</span></> : null}.
        Clique dessus pour confirmer ton inscription et recevoir ton QR code d&apos;accueil.
      </p>
      <ul className="mt-6 space-y-2 text-graphite">
        <li>Le lien est valable 72 heures. Sans confirmation, l&apos;inscription est supprimée.</li>
        <li>Rien reçu après quelques minutes ? Regarde dans les spams et l&apos;onglet Promotions.</li>
      </ul>
      {cv === "0" && (
        <div className="mt-8">
          <Alert tone="info" title="Ton CV n'a pas pu être enregistré.">
            Ton inscription est bien prise en compte. Tu pourras ajouter ton CV depuis ton espace.
          </Alert>
        </div>
      )}
      <p className="mt-10 border-t border-jade/15 pt-6">
        <Link href="/lien" className="font-semibold text-emerald underline">
          Renvoyer le lien de confirmation
        </Link>
      </p>
    </div>
  );
}
