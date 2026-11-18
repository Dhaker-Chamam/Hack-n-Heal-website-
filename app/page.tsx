import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/brand/logo";
import { Games } from "@/components/landing/games";
import { About, Faq, Gain, SectionTitle } from "@/components/landing/interactive";
import { GrowLine, MotionProvider, Reveal } from "@/components/landing/motion";
import { Hero, LandingNav } from "@/components/landing/nav-hero";
import { FooterBar, LogoRow, SPONSORS_2022 } from "@/components/site-footer";
import { buttonClass } from "@/components/ui/button";

const COMPETITIONS = [
  {
    name: "Le hackathon médical",
    text: "Une semaine pour répondre à un vrai défi de santé, en équipe mixte, puis présenter son projet devant le jury à l'INSAT.",
    facts: "1 semaine · Équipes de 4 à 7 · Pitch le dimanche 6 décembre",
    href: "/defi",
    cta: "Voir le défi médical",
    tone: "bg-emerald text-paper",
  },
  {
    name: "Le hackathon bioinformatique",
    text: "Douze heures non-stop sur Kaggle pour explorer ce que l'apprentissage profond et l'analyse de données biologiques apportent à la médecine.",
    facts: "12 heures · Équipes de 2 à 4 · Samedi 5 décembre",
    href: "/bioinfo",
    cta: "Voir le hackathon bioinformatique",
    tone: "bg-jade text-mist",
  },
];

function Competitions() {
  return (
    <section id="competitions" className="scroll-mt-20 bg-mist py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <SectionTitle>Deux compétitions. Deux rythmes.</SectionTitle>
        </Reveal>
      </div>
      <div className="mx-auto mt-12 grid max-w-7xl gap-4 px-5 md:grid-cols-2 md:px-10">
        {COMPETITIONS.map((c, i) => (
          <Reveal key={c.name} delay={i * 0.12}>
            <article className={`group relative flex min-h-[26rem] flex-col justify-end overflow-hidden p-8 ${c.tone} ${i ? "md:mt-16" : ""}`}>
              <div
                aria-hidden
                className={`absolute -right-10 -top-10 w-64 opacity-15 transition-transform duration-700 group-hover:scale-110 ${i ? "-rotate-[8deg]" : "rotate-[8deg]"} group-hover:rotate-0`}
              >
                <Icon dark className="w-full" />
              </div>
              <div className="relative">
                <h3 className="text-3xl font-bold leading-tight text-current md:text-4xl">{c.name}</h3>
                <p className="mt-4 max-w-sm">{c.text}</p>
                <p className="mt-6 border-t border-current/25 pt-4 text-small font-semibold">{c.facts}</p>
                <Link href={c.href} className="mt-4 inline-block text-small font-semibold underline decoration-2 underline-offset-4 hover:no-underline focus-visible:outline-white">
                  {c.cta}
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const THEMES = [
  {
    n: "Cancer",
    s: "Guérir et prévenir",
    t: "Ce que l'IA, les données biologiques et les méthodes de calcul apportent à la recherche, à la prévention et au traitement du cancer.",
  },
  {
    n: "Maladies auto-immunes",
    s: "Quand le corps se retourne contre lui-même",
    t: "Comment la biologie computationnelle, la recherche médicale et l'IA font avancer l'étude des maladies auto-immunes, en particulier le diabète.",
  },
  {
    n: "Médecine d'aujourd'hui",
    s: "Le soin, transformé",
    t: "IA, médecine personnalisée, aide au diagnostic et recherche guidée par les données : ce qui change dans le soin.",
  },
];

function Themes() {
  return (
    <section id="themes" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-28 md:px-10">
      <Reveal>
        <SectionTitle>Trois questions qui méritent une réponse.</SectionTitle>
      </Reveal>
      <ol className="mt-14 divide-y divide-jade/15 border-y border-jade/15">
        {THEMES.map((t, i) => (
          <li key={t.n}>
            <Reveal>
              <div className="group grid items-center gap-4 py-10 transition-colors duration-300 hover:bg-mist/60 md:grid-cols-[6rem_1.3fr_1fr] md:px-4">
                <span aria-hidden className="tabular text-5xl font-extrabold text-emerald/30 transition-colors duration-300 group-hover:text-emerald">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="text-3xl font-bold text-jade md:text-5xl">{t.n}</h3>
                  <p className="mt-1 font-medium text-emerald">{t.s}</p>
                </div>
                <p className="text-graphite">{t.t}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

const STEPS = [
  ["Intelligence artificielle", "Les idées de base de l'apprentissage à partir des données."],
  ["Apprentissage profond", "Les réseaux de neurones, des principes à la pratique."],
  ["Bioinformatique", "Travailler avec des jeux de données biologiques."],
  ["L'IA appliquée à la médecine", "Là où les modèles rencontrent la réalité clinique."],
  ["Résoudre entre disciplines", "Travailler à plusieurs, au-delà de sa spécialité."],
];

function Workshops() {
  return (
    <section id="ateliers" className="on-dark relative scroll-mt-20 overflow-hidden bg-abyss py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <SectionTitle dark>Apprendre. Explorer. Se préparer.</SectionTitle>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-5 max-w-lg text-mist/80">
            Des ateliers préparatoires ont lieu avant l&apos;événement. Le programme et le format seront annoncés par les
            organisateurs.
          </p>
        </Reveal>
        <div className="relative mt-16 pl-8 md:pl-0">
          <GrowLine className="absolute bottom-0 left-2 top-0 w-1 bg-luminous md:left-1/2 md:-ml-0.5" />
          <ol>
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <Reveal>
                  <div className={`relative mb-10 md:w-1/2 ${i % 2 ? "md:ml-auto md:pl-12" : "md:pr-12 md:text-right"}`}>
                    <span
                      aria-hidden
                      className={`absolute top-3 h-1 w-7 bg-luminous -left-8 ${i % 2 ? "-rotate-[30deg] md:left-0" : "rotate-[30deg] md:-right-0 md:left-auto"}`}
                    />
                    <h3 className="text-2xl font-semibold text-mist">{t}</h3>
                    <p className="text-mist/70">{d}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
          <Reveal>
            <p className="relative w-fit bg-abyss py-2 font-semibold text-luminous md:mx-auto md:px-4">…puis Hack&apos;n&apos;Heal.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const CLUBS = [
  {
    name: "Symbio INSAT",
    logo: { src: "/logos/organisateurs/symbio-insat.svg", width: 572, height: 572 },
    text: "Le club de biologie de l'INSAT, créé en 2020 par des étudiants du département de biologie. Plus de 100 membres actifs.",
  },
  {
    name: "INSAT Android Club",
    logo: { src: "/logos/organisateurs/insat-android-club.svg", width: 520, height: 526 },
    text: "Le premier club Android de Tunisie, actif à l'INSAT depuis 2011. 100 membres actifs et plus de 20 formations par an.",
  },
];

function Organizers() {
  return (
    <section className="border-y border-jade/15 bg-mist py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-[1fr_2fr] md:px-10">
        <Reveal>
          <h2 className="text-3xl font-bold text-jade">Réunis par une même vision.</h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2">
          {CLUBS.map((c) => (
            <Reveal key={c.name}>
              <div className="flex gap-4">
                {/* Organiser logos keep their own colours, on White */}
                <div className="grid size-20 shrink-0 place-items-center bg-white p-2">
                  <Image src={c.logo.src} alt={c.name} width={c.logo.width} height={c.logo.height} className="h-full w-auto" />
                </div>
                <div>
                  <h3 className="font-bold text-jade">{c.name}</h3>
                  <p className="text-small text-graphite">{c.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl px-5 md:px-10">
        <div className="bg-white px-6 py-6">
          <LogoRow title="Ils nous ont soutenus en 2022" logos={SPONSORS_2022} size="md" />
        </div>
      </div>
    </section>
  );
}

function Final() {
  return (
    <footer className="on-dark relative overflow-hidden bg-abyss pb-10 pt-28">
      <div aria-hidden className="pointer-events-none absolute right-0 top-16 w-[50vw] max-w-lg opacity-15">
        <Icon dark className="w-full" />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <h2 className="max-w-4xl text-[clamp(2.4rem,7vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-mist">
            L&apos;avenir de la santé est interdisciplinaire.
          </h2>
        </Reveal>
        <p className="mt-6 max-w-md text-mist/80">
          Apporte ce que tu sais. Découvre d&apos;autres regards. Rejoins l&apos;intersection.
        </p>
        <div className="mt-8">
          <Link href="/inscription" className={buttonClass("on-dark")}>
            S&apos;inscrire gratuitement
          </Link>
        </div>
        <div className="mt-24 border-t border-mist/15 pt-10">
          <FooterBar />
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <MotionProvider>
      <a
        href="#a-propos"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:bg-white focus:px-4 focus:py-2 focus:text-jade"
      >
        Aller au contenu
      </a>
      <LandingNav />
      <main>
        <Hero />
        <About />
        <Competitions />
        <Themes />
        <Workshops />
        <Gain />
        <Organizers />
        <Games />
        <Faq />
      </main>
      <Final />
    </MotionProvider>
  );
}
