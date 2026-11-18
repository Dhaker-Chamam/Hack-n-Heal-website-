import { cookies } from "next/headers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PARTICIPANT_COOKIE } from "@/lib/session";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const signedIn = Boolean((await cookies()).get(PARTICIPANT_COOKIE)?.value);
  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-jade"
      >
        Aller au contenu
      </a>
      <SiteHeader signedIn={signedIn} />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
