import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader signedIn={false} />
      <main id="contenu" className="mx-auto w-full max-w-2xl flex-1 px-5 py-16 md:py-24">
        <h1 className="t-headline">Cette page n&apos;existe pas</h1>
        <p className="mt-4 text-ink">Le lien est peut-être incomplet, ou la page a été déplacée.</p>
        <ul className="mt-8 grid gap-2">
          <li>
            <Link href="/inscription" className="font-semibold text-emerald underline">
              S&apos;inscrire à Hack&apos;n&apos;Heal 2026
            </Link>
          </li>
          <li>
            <Link href="/moi" className="font-semibold text-emerald underline">
              Ouvrir mon espace
            </Link>
          </li>
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
