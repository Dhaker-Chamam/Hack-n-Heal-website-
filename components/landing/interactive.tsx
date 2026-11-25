"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { EASE, Reveal } from "./motion";

export function SectionTitle({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <h2 className={`text-[clamp(2.2rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.02em] ${dark ? "text-mist" : "text-jade"}`}>
      {children}
    </h2>
  );
}

const DISCIPLINES = [
  { k: "Médecine", t: "De vraies questions cliniques, et le jugement pour savoir lesquelles comptent.", x: 150, y: 140, c: "#0B7A5E" },
  { k: "Bioinformatique", t: "Des données biologiques transformées en matière qu'un modèle peut apprendre.", x: 270, y: 140, c: "#3FBF9C" },
  { k: "Intelligence artificielle", t: "Des méthodes qui trouvent des motifs que personne ne lirait à la main.", x: 210, y: 240, c: "#E6EFEC" },
];

export function About() {
  const [a, setA] = useState<number | null>(null);
  return (
    <section id="a-propos" className="mx-auto grid max-w-7xl scroll-mt-20 gap-12 px-5 py-28 md:grid-cols-2 md:px-10">
      <div>
        <Reveal>
          <SectionTitle>Des disciplines différentes. Une même mission.</SectionTitle>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-md text-lg text-graphite">
            Hack&apos;n&apos;Heal réunit médecine, bioinformatique et intelligence artificielle à l&apos;INSAT pour s&apos;attaquer à de
            vrais problèmes de santé. Des ateliers préparatoires ouvrent la marche, pour que chacun arrive prêt à travailler avec
            les autres disciplines.
          </p>
        </Reveal>
        <ul className="mt-8 space-y-3">
          {DISCIPLINES.map((d, i) => (
            <li key={d.k}>
              <button
                type="button"
                aria-pressed={a === i}
                onMouseEnter={() => setA(i)}
                onFocus={() => setA(i)}
                onMouseLeave={() => setA(null)}
                onBlur={() => setA(null)}
                className={`w-full border-l-4 py-2 pl-4 text-left transition-colors duration-200 ${a === i ? "border-emerald" : "border-mist"}`}
              >
                <span className="block font-semibold text-jade">{d.k}</span>
                <span className="text-small text-graphite">{d.t}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <Reveal className="self-center">
        <svg viewBox="0 0 420 380" className="w-full" role="img" aria-label="Médecine, bioinformatique et IA se rejoignent sur la santé">
          <rect width="420" height="380" fill="#06292B" />
          {DISCIPLINES.map((d, i) => (
            <circle
              key={d.k}
              cx={d.x}
              cy={d.y}
              r={a === i ? 98 : 90}
              fill={d.c}
              fillOpacity={a === null || a === i ? 0.55 : 0.2}
              style={{ mixBlendMode: "screen", transition: "all .4s" }}
            />
          ))}
          <text x="150" y="105" fill="#E6EFEC" fontSize="13" fontWeight="600" textAnchor="middle">Médecine</text>
          <text x="285" y="105" fill="#06292B" fontSize="13" fontWeight="600" textAnchor="middle">Bioinformatique</text>
          <text x="210" y="300" fill="#06292B" fontSize="13" fontWeight="600" textAnchor="middle">IA</text>
          <g transform="translate(192,150)">
            <svg width="36" height="30" viewBox="0 0 96 80">
              <path d="M48 74V6M48 58L59.5 38M48 44L36.5 24" stroke="#06292B" strokeWidth="9" fill="none" />
            </svg>
          </g>
          <text x="210" y="198" fill="#06292B" fontSize="11" fontWeight="700" textAnchor="middle">Santé</text>
        </svg>
      </Reveal>
    </section>
  );
}

const GAIN = [
  {
    k: "Informatique et ingénierie",
    q: "Ne te contente pas de construire de la technologie. Construis une technologie qui compte.",
    p: [
      "Découvrir les applications de l'IA en sciences et en santé.",
      "Comprendre de vrais problèmes médicaux et biologiques.",
      "Explorer les applications du machine learning et du deep learning.",
      "Apprendre à travailler avec des étudiants en médecine et en biologie.",
    ],
    note: "",
  },
  {
    k: "Médecine et pharmacie",
    q: "La technologie est un outil. L'expertise médicale lui donne une direction.",
    p: [
      "Découvrir comment l'IA peut aider la recherche médicale et la décision clinique.",
      "Comprendre ce que l'IA peut et ne peut pas faire en santé.",
      "Voir comment le savoir médical oriente des solutions techniques utiles.",
      "Découvrir comment soignants et ingénieurs peuvent travailler ensemble.",
    ],
    note: "L'IA ne remplace pas les médecins. Elle appuie l'expertise médicale et ouvre de nouvelles possibilités en santé.",
  },
  {
    k: "Biologie et bioinformatique",
    q: "Transforme le savoir biologique en possibilités de calcul.",
    p: [
      "Découvrir des applications concrètes de la bioinformatique.",
      "Explorer l'analyse de jeux de données biologiques.",
      "Comprendre comment le machine learning peut soutenir la recherche en biologie.",
      "Voir comment outils de calcul et expertise biologique se complètent.",
    ],
    note: "L'IA a besoin du savoir biologique pour produire des résultats scientifiques qui ont du sens.",
  },
];

export function Gain() {
  const [i, setI] = useState(0);
  const base = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const g = GAIN[i];
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const n = (i + step + GAIN.length) % GAIN.length;
    setI(n);
    tabs.current[n]?.focus();
  };
  return (
    <section className="on-dark bg-jade py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <Reveal>
          <SectionTitle dark>Ta discipline est ton point de départ, pas ta limite.</SectionTitle>
        </Reveal>
        <div role="tablist" aria-label="Choisis ta discipline" className="mt-12 flex flex-wrap gap-2" onKeyDown={onKey}>
          {GAIN.map((x, n) => (
            <button
              key={x.k}
              ref={(el) => {
                tabs.current[n] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${n}`}
              aria-selected={i === n}
              aria-controls={`${base}-panel`}
              tabIndex={i === n ? 0 : -1}
              onClick={() => setI(n)}
              className={`px-5 py-3 text-small font-semibold transition-colors duration-200 ${
                i === n ? "bg-luminous text-abyss" : "border border-mist/30 text-mist hover:bg-mist/10"
              }`}
            >
              {x.k}
            </button>
          ))}
        </div>
        <motion.div
          key={i}
          id={`${base}-panel`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${i}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-10 grid gap-10 md:grid-cols-2"
        >
          <p className="text-3xl font-bold leading-tight text-mist md:text-4xl">{g.q}</p>
          <div>
            <ul className="space-y-4">
              {g.p.map((p) => (
                <li key={p} className="flex gap-3 text-mist/90">
                  <span aria-hidden className="mt-2.5 h-1 w-5 shrink-0 -rotate-[30deg] bg-luminous" />
                  {p}
                </li>
              ))}
            </ul>
            {g.note && <p className="mt-8 border-l-4 border-luminous pl-4 font-medium text-luminous">{g.note}</p>}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const link = "font-semibold text-emerald underline";

const FAQS: [string, ReactNode][] = [
  [
    "Qu'est-ce que Hack'n'Heal ?",
    "Un événement interdisciplinaire à l'INSAT qui réunit médecine, bioinformatique et IA autour de vrais problèmes de santé. En 2026 : le cancer et les maladies auto-immunes, en particulier le diabète.",
  ],
  [
    "Qui peut participer ?",
    "Les étudiant·e·s de 18 ans ou plus en médecine, pharmacie, biologie, bioinformatique, informatique, ingénierie, data et IA. La participation est gratuite.",
  ],
  [
    "Où et quand ?",
    "À l'INSAT, Centre Urbain Nord, Tunis, le samedi 5 et le dimanche 6 décembre 2026. Le hackathon médical commence à distance dès la publication du défi, le samedi 28 novembre.",
  ],
  ["Peut-on participer aux deux compétitions ?", "Oui, avec une équipe différente dans chacune."],
  [
    "Faut-il venir avec une équipe ?",
    "Non. Tu peux créer une équipe, en rejoindre une avec son code, ou t'inscrire seul·e : les organisateurs te placent dans une équipe. Une équipe médicale compte 4 à 7 membres, une équipe bioinformatique 2 à 4, avec au moins un profil santé et un profil tech.",
  ],
  [
    "Sur quoi portent les ateliers ?",
    "Intelligence artificielle, apprentissage profond, bioinformatique, applications médicales de l'IA et résolution de problèmes entre disciplines.",
  ],
  [
    "Comment s'inscrire ?",
    <>
      Sur la{" "}
      <a href="/inscription" className={link}>
        page d&apos;inscription
      </a>
      , en quelques minutes. Hackathon médical : jusqu&apos;au jeudi 26 novembre à 23:59. Pour le hackathon bioinformatique, la page
      d&apos;inscription indique si les inscriptions sont ouvertes.
    </>,
  ],
  [
    "Comment se passe le rendu du hackathon médical ?",
    "Avant le jeudi 3 décembre à 23:59, chaque équipe dépose depuis son espace un titre, un résumé et le lien d'une vidéo de 5 minutes maximum. Le dimanche 6 décembre, elle présente son projet devant le jury à l'INSAT.",
  ],
  ["Les ateliers sont-ils en ligne ou en présentiel ?", "Le format sera annoncé par les organisateurs."],
];

export function Faq() {
  const [o, setO] = useState<number | null>(0);
  const base = useId();
  return (
    <section id="faq" className="mx-auto grid max-w-7xl scroll-mt-20 gap-10 px-5 py-28 md:grid-cols-[1fr_1.6fr] md:px-10">
      <div>
        <Reveal>
          <SectionTitle>Des questions ?</SectionTitle>
        </Reveal>
        <p className="mt-6 max-w-xs text-graphite">Écris-nous, nous répondons vite.</p>
        <a
          href="mailto:symbioinsat@gmail.com"
          className="mt-5 inline-flex min-h-12 items-center border border-jade px-6 text-small font-semibold text-jade transition-[background-color,color,transform] duration-200 hover:bg-jade hover:text-paper motion-safe:hover:-translate-y-0.5"
        >
          Nous écrire
        </a>
      </div>
      <div className="divide-y divide-jade/15 border-y border-jade/15">
        {FAQS.map(([q, a], i) => (
          <div key={q}>
            <h3>
              <button
                type="button"
                onClick={() => setO(o === i ? null : i)}
                aria-expanded={o === i}
                aria-controls={`${base}-${i}`}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-semibold text-jade"
              >
                {q}
                <Plus aria-hidden className={`shrink-0 text-emerald transition-transform duration-200 ${o === i ? "rotate-45" : ""}`} />
              </button>
            </h3>
            <motion.div
              id={`${base}-${i}`}
              initial={false}
              animate={{ height: o === i ? "auto" : 0, opacity: o === i ? 1 : 0 }}
              className="overflow-hidden"
              inert={o !== i}
            >
              <p className="max-w-measure pb-5 text-graphite">{a}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
