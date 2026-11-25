import Link from "next/link";
import { Lockup } from "./brand/logo";
import { NavLinks, type NavItem } from "./nav-links";
import { ButtonLink } from "./ui/button";

export const PUBLIC_NAV: NavItem[] = [
  { href: "/defi", label: "Défi médical" },
  { href: "/bioinfo", label: "Bioinformatique" },
  { href: "/the-wall", label: "The Wall" },
  { href: "/jeux", label: "Jeux" },
];

/** Abyss band, as the landing page's navigation: lockup, plain links, one Luminous action. */
export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  // Signed in, the button already leads to /moi; signed out, the nav offers the way back to an existing registration.
  const items: NavItem[] = signedIn ? PUBLIC_NAV : [...PUBLIC_NAV, { href: "/moi", label: "Retrouver mon inscription" }];
  return (
    <header className="on-dark bg-abyss text-mist">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 pb-2 pt-4 md:py-4">
        <Link href="/" aria-label="Hack'n'Heal 2026, accueil" className="shrink-0 py-1">
          <Lockup dark size={22} />
        </Link>
        <nav aria-label="Navigation principale" className="hidden min-w-0 flex-1 md:block">
          <NavLinks items={items} />
        </nav>
        <ButtonLink href={signedIn ? "/moi" : "/inscription"} variant="on-dark" size="sm" className="shrink-0">
          {signedIn ? "Mon espace" : "S'inscrire"}
        </ButtonLink>
      </div>
      <nav aria-label="Navigation principale" className="mx-auto max-w-6xl px-5 pb-2 md:hidden">
        <NavLinks items={items} />
      </nav>
    </header>
  );
}
