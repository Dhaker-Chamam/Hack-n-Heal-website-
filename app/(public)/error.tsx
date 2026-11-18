"use client";

import { Button } from "@/components/ui/button";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
      <h1 className="t-headline">Le site ne répond pas pour l&apos;instant</h1>
      <p className="mt-4 max-w-measure text-ink">
        Ce n&apos;est pas toi : notre serveur a rencontré une erreur. Réessaie dans un instant. Si tu remplissais le
        formulaire d&apos;inscription, ce que tu as saisi reste enregistré sur cet appareil.
      </p>
      <div className="mt-8">
        <Button type="button" onClick={reset}>
          Réessayer
        </Button>
      </div>
      <p className="mt-10 text-small text-graphite">
        Si le problème dure, écris à{" "}
        <a href="mailto:symbioinsat@gmail.com" className="font-semibold text-emerald underline">
          symbioinsat@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
