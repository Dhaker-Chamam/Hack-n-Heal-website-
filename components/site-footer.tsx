import Image from "next/image";
import Link from "next/link";
import { Lockup } from "./brand/logo";

type Logo = { name: string; src: string; width: number; height: number };

// Logo files are copies of logos/ (the folder the organisers supplied), served from public/logos/.
export const ORGANISERS: Logo[] = [
  { name: "Symbio INSAT", src: "/logos/organisateurs/symbio-insat.svg", width: 572, height: 572 },
  { name: "INSAT Android Club", src: "/logos/organisateurs/insat-android-club.svg", width: 520, height: 526 },
];

// Alphabetical, so the order implies no ranking.
export const SPONSORS_2022: Logo[] = [
  { name: "619 Factory", src: "/logos/sponsors-2022/619-factory.svg", width: 512, height: 604 },
  { name: "HexaByte", src: "/logos/sponsors-2022/hexabyte.svg", width: 597, height: 230 },
  { name: "Indinya", src: "/logos/sponsors-2022/indinya.svg", width: 512, height: 243 },
  { name: "Orange", src: "/logos/sponsors-2022/orange.svg", width: 509, height: 488 },
  { name: "Youth for Climate Tunisia", src: "/logos/sponsors-2022/youth-for-climate-tunisia.svg", width: 512, height: 512 },
];

// Contacts as printed in the 2026 sponsorship dossier.
const CLUBS = [
  {
    name: "Symbio INSAT",
    links: [
      { label: "symbioinsat@gmail.com", href: "mailto:symbioinsat@gmail.com" },
      { label: "Instagram", href: "https://www.instagram.com/symbio.insat/" },
      { label: "Facebook", href: "https://www.facebook.com/symbioinsatclub" },
    ],
  },
  {
    name: "INSAT Android Club",
    links: [
      { label: "contact@insatandroidclub.com", href: "mailto:contact@insatandroidclub.com" },
      { label: "Instagram", href: "https://www.instagram.com/insat_android_club/" },
      { label: "Facebook", href: "https://www.facebook.com/INSAT.Android.club" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/android-club-insat/" },
    ],
  },
];

export function LogoRow({ title, logos, size }: { title: string; logos: Logo[]; size: "lg" | "md" }) {
  return (
    <div>
      <h2 className="text-small font-semibold text-graphite">{title}</h2>
      <ul className={`mt-4 flex flex-wrap items-center ${size === "lg" ? "gap-8" : "gap-x-6 gap-y-5 sm:gap-x-8"}`}>
        {logos.map((l) => (
          <li key={l.name}>
            <Image
              src={l.src}
              alt={l.name}
              title={l.name}
              width={l.width}
              height={l.height}
              className={size === "lg" ? "h-16 w-auto" : "h-11 w-auto max-w-28"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

const linkClass = "text-mist/80 hover:text-luminous";

/** The landing page's closing bar: lockup, site links, each club's contacts. Sits inside an Abyss band. */
export function FooterBar() {
  return (
    <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
      <div>
        <Link href="/" aria-label="Hack'n'Heal 2026, accueil" className="inline-block py-1">
          <Lockup dark size={22} />
        </Link>
        <p className="mt-4 max-w-xs text-small text-mist/80">
          5 et 6 décembre 2026 à l&apos;INSAT, Centre Urbain Nord, Tunis. Organisé par Symbio INSAT et INSAT Android Club.
        </p>
      </div>
      <nav aria-label="Liens utiles">
        <h2 className="text-small text-stone">Le site</h2>
        <ul className="mt-3 space-y-2 text-small">
          <li><Link className={linkClass} href="/inscription">S&apos;inscrire</Link></li>
          <li><Link className={linkClass} href="/lien">Recevoir mon lien personnel</Link></li>
          <li><Link className={linkClass} href="/reglement">Règlement</Link></li>
          <li><Link className={linkClass} href="/confidentialite">Données personnelles</Link></li>
        </ul>
      </nav>
      {CLUBS.map((club) => (
        <div key={club.name}>
          <h2 className="text-small text-stone">{club.name}</h2>
          <ul className="mt-3 space-y-2 text-small">
            {club.links.map((l) => (
              <li key={l.href}>
                <a className={`${linkClass} break-all`} href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      {/* Third-party logos keep their own colours, so they sit on White, never on the dark band. */}
      <div className="border-t border-jade/15 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-[auto_1fr] md:gap-0">
          <LogoRow title="Organisé par" logos={ORGANISERS} size="lg" />
          <div className="border-t border-jade/15 pt-8 md:ml-12 md:border-l md:border-t-0 md:pl-12 md:pt-0">
            <LogoRow title="Ils nous ont soutenus en 2022" logos={SPONSORS_2022} size="md" />
          </div>
        </div>
      </div>
      <div className="on-dark bg-abyss text-mist">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <FooterBar />
        </div>
      </div>
    </footer>
  );
}
