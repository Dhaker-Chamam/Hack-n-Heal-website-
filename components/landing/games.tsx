"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/brand/logo";
import { SectionTitle } from "./interactive";
import { Reveal } from "./motion";

type Q = { q: string; o: string[]; a: number; why: string };

const QUIZ: Q[] = [
  { q: "Laquelle de ces bases n'est pas une base de l'ADN ?", o: ["Adénine", "Uracile", "Guanine", "Cytosine"], a: 1, why: "L'uracile remplace la thymine dans l'ARN." },
  { q: "Que veut dire CNN en apprentissage profond ?", o: ["Réseau de neurones cellulaire", "Réseau de neurones convolutif", "Réseau de nœuds cliniques", "Normalisation neuronale calculée"], a: 1, why: "Les réseaux convolutifs sont très utilisés pour analyser les images médicales." },
  { q: "Quel organe produit l'insuline ?", o: ["Le foie", "Le rein", "Le pancréas", "La rate"], a: 2, why: "Ce sont les cellules bêta du pancréas qui fabriquent l'insuline." },
  { q: "Dans une maladie auto-immune, le système immunitaire attaque…", o: ["Seulement les virus", "Les tissus de l'organisme", "Seulement les bactéries", "Rien du tout"], a: 1, why: "Il ne distingue plus le soi du non-soi." },
  { q: "Un modèle qui mémorise ses données d'entraînement mais échoue sur de nouvelles données fait du…", o: ["Sous-apprentissage", "Régularisation", "Surapprentissage", "Normalisation"], a: 2, why: "Des données de test mises de côté permettent de le repérer." },
  { q: "À quoi sert principalement l'outil BLAST ?", o: ["Comparer des séquences biologiques", "Imager des tumeurs", "Entraîner des réseaux de neurones", "Modifier des gènes"], a: 0, why: "Il cherche des séquences d'ADN ou de protéines similaires dans des bases de données." },
];
const CONNECT: Q[] = [
  { q: "Tumeur · IRM · segmentation", o: ["IA en imagerie médicale", "Astronomie", "Cryptographie", "Conception de jeux"], a: 0, why: "Des modèles délimitent les tumeurs sur les images pour aider les radiologues." },
  { q: "FASTA · alignement · génome", o: ["Design web", "Bioinformatique", "Robotique", "Comptabilité"], a: 1, why: "FASTA est un format texte standard pour les séquences." },
  { q: "Lymphocytes T · anticorps · lupus", o: ["Compilateurs", "Orthopédie", "Auto-immunité", "Réseaux"], a: 2, why: "Les trois reviennent sans cesse dans la recherche sur l'auto-immunité." },
  { q: "Neurones · couches · poids", o: ["Apprentissage profond", "Pharmacie", "Génétique", "Radiologie"], a: 0, why: "Ce sont les briques d'un réseau de neurones artificiel." },
];
const AIH: Q[] = [
  { q: "« En plongeant au cœur de la riche tapisserie de la biologie cellulaire, un paysage fascinant de voies interconnectées se dessine. »", o: ["IA", "Humain"], a: 0, why: "Grandiloquent, vague et plein de formules toutes faites." },
  { q: "« mon pipeline a planté à 3h du mat parce que j'avais oublié de normaliser les comptages. plus jamais. »", o: ["IA", "Humain"], a: 1, why: "Précis, brouillon et personnel." },
  { q: "« En conclusion, l'alliance de l'IA et de la bioinformatique constitue un véritable changement de paradigme pour tout l'écosystème de la santé. »", o: ["IA", "Humain"], a: 0, why: "De grandes affirmations, aucun détail concret." },
  { q: "« Ils ont encore déplacé les souris de l'animalerie, la manip est décalée de deux semaines. Le café ne suffit plus. »", o: ["IA", "Humain"], a: 1, why: "Un détail vécu et un peu d'humour." },
];
const BIO = ["ATGAAACCC", "GGATTACAT", "CTTAGGATC"];
const FACTS = [
  "ATG est le codon d'initiation : il ouvre presque toutes les protéines.",
  "L'ARN utilise l'uracile (U) là où l'ADN utilise la thymine (T).",
  "La transcription copie un gène en ARN messager.",
];

const cta = "mt-4 bg-luminous px-5 py-3 text-small font-semibold text-abyss hover:bg-mist";

function Quiz({ qs, intro }: { qs: Q[]; intro?: string }) {
  const [i, setI] = useState(0);
  const [p, setP] = useState<number | null>(null);
  const [s, setS] = useState(0);
  const [done, setDone] = useState(false);
  const q = qs[i];
  if (done)
    return (
      <div>
        <p className="tabular text-5xl font-extrabold text-luminous">
          {s}/{qs.length}
        </p>
        <p className="mt-3 text-mist/80">
          {s === qs.length ? "Sans faute." : s >= qs.length / 2 ? "Solide. Une autre partie ?" : "Bon échauffement. Encore une ?"}
        </p>
        <button type="button" onClick={() => { setI(0); setP(null); setS(0); setDone(false); }} className={`${cta} mt-6`}>
          Rejouer
        </button>
      </div>
    );
  return (
    <div>
      <p className="text-small text-stone">
        Question <span className="tabular">{i + 1}</span> sur {qs.length}
        {intro ? ` · ${intro}` : ""}
      </p>
      <h3 className="mt-3 text-xl font-bold leading-snug text-mist md:text-2xl">{q.q}</h3>
      <div className={`mt-6 grid gap-2 ${q.o.length > 2 ? "sm:grid-cols-2" : "grid-cols-2"}`}>
        {q.o.map((o, n) => {
          const right = p !== null && n === q.a;
          const wrong = p === n && n !== q.a;
          return (
            <button
              key={o}
              type="button"
              disabled={p !== null}
              onClick={() => { setP(n); if (n === q.a) setS(s + 1); }}
              className={`flex items-center justify-between gap-2 border px-4 py-3 text-left text-small font-medium transition-colors ${
                right ? "border-luminous bg-luminous text-abyss" : wrong ? "border-stone bg-graphite text-mist" : "border-mist/25 text-mist hover:bg-mist/10"
              }`}
            >
              {o}
              {right && <Check aria-label="bonne réponse" size={16} />}
              {wrong && <X aria-label="mauvaise réponse" size={16} />}
            </button>
          );
        })}
      </div>
      {p !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5" role="status">
          <p className="text-small text-mist/80">
            {p === q.a ? "Bonne réponse. " : "Pas tout à fait. "}
            {q.why}
          </p>
          <button type="button" onClick={() => { if (i + 1 < qs.length) { setI(i + 1); setP(null); } else setDone(true); }} className={cta}>
            {i + 1 < qs.length ? "Question suivante" : "Voir mon score"}
          </button>
        </motion.div>
      )}
    </div>
  );
}

function Bio() {
  const [i, setI] = useState(0);
  const [v, setV] = useState("");
  const [res, setRes] = useState<"" | "ok" | "no">("");
  const [s, setS] = useState(0);
  const [done, setDone] = useState(false);
  const ans = BIO[i]?.replace(/T/g, "U");
  if (done)
    return (
      <div>
        <p className="tabular text-5xl font-extrabold text-luminous">
          {s}/{BIO.length}
        </p>
        <p className="mt-3 text-mist/80">Séquences transcrites.</p>
        <button type="button" onClick={() => { setI(0); setV(""); setRes(""); setS(0); setDone(false); }} className={`${cta} mt-6`}>
          Rejouer
        </button>
      </div>
    );
  const check = () => {
    const ok = v.trim().toUpperCase() === ans;
    setRes(ok ? "ok" : "no");
    if (ok) setS(s + 1);
  };
  return (
    <div>
      <p className="text-small text-stone">
        Séquence <span className="tabular">{i + 1}</span> sur {BIO.length}. Transcris ce brin codant d&apos;ADN en ARN messager.
        Indice : T devient U.
      </p>
      <p className="mt-4 break-all text-3xl font-bold tracking-[0.25em] text-luminous">{BIO[i]}</p>
      <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (res === "") check(); }}>
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          disabled={res !== ""}
          maxLength={9}
          aria-label="Ta réponse en ARN messager"
          placeholder="Écris l'ARNm"
          autoComplete="off"
          autoCapitalize="characters"
          className="w-full border border-mist/30 bg-transparent px-4 py-3 uppercase tracking-[0.2em] text-mist placeholder:normal-case placeholder:tracking-normal placeholder:text-stone"
        />
        {res === "" && (
          <button type="submit" className="bg-luminous px-5 text-small font-semibold text-abyss hover:bg-mist">
            Vérifier
          </button>
        )}
      </form>
      {res !== "" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5" role="status">
          <p className="text-small text-mist/80">
            {res === "ok" ? "Bonne réponse. " : `Pas tout à fait : la réponse est ${ans}. `}
            {FACTS[i]}
          </p>
          <button type="button" onClick={() => { if (i + 1 < BIO.length) { setI(i + 1); setV(""); setRes(""); } else setDone(true); }} className={cta}>
            {i + 1 < BIO.length ? "Séquence suivante" : "Voir mon score"}
          </button>
        </motion.div>
      )}
    </div>
  );
}

function GameDialog({ id, title, onClose }: { id: number; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose} className="on-dark fixed inset-0 z-[60] grid place-items-center bg-abyss/90 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[90svh] w-full overflow-y-auto bg-jade p-6 md:p-10 ${id === 4 ? "max-w-5xl" : "max-w-2xl"}`}
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-mist md:text-3xl">{title}</h2>
          <button type="button" autoFocus onClick={onClose} aria-label="Fermer le jeu" className="text-mist hover:text-luminous">
            <X />
          </button>
        </div>
        {id === 0 && <Quiz qs={QUIZ} />}
        {id === 1 && <Quiz qs={CONNECT} intro="Quel domaine relie ces mots ?" />}
        {id === 2 && <Quiz qs={AIH} intro="Écrit par une IA ou par un humain ? Ces exemples ont été écrits pour le jeu." />}
        {id === 3 && <Bio />}
        {id === 4 && (
          <>
            <iframe src={PETRI_TURF} title="Petri Turf" sandbox="allow-scripts allow-same-origin" className="aspect-video w-full bg-abyss" />
            <p className="mt-4 text-small text-mist/80">
              Bataille de territoire en 60 secondes, seul ou à deux sur le même clavier. Clique sur le jeu pour commencer. Par Souhail Ben
              Belhassen.{" "}
              <a href={PETRI_TURF} target="_blank" rel="noopener noreferrer" className="font-semibold text-luminous underline">
                Ouvrir en plein écran
              </a>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

const GAMES = [
  ["Quiz scientifique", "Teste tes connaissances."],
  ["Trouve le lien", "Relie les disciplines."],
  ["IA ou humain ?", "Devine qui a écrit."],
  ["Défi bioinfo", "Décode une séquence."],
  ["Petri Turf", "Conquiers la boîte de Petri."],
] as const;
const PETRI_TURF = "https://loomsou.nekoweb.org/";

/** The five warm-up games: one card each, played in a dialog. On the landing page and on /jeux. */
export function GameGrid() {
  const [open, setOpen] = useState<number | null>(null);
  const openers = useRef<(HTMLButtonElement | null)[]>([]);
  const close = () => {
    const was = open;
    setOpen(null);
    if (was !== null) openers.current[was]?.focus();
  };
  return (
    <>
      <div className="grid gap-px bg-jade/15 sm:grid-cols-2 lg:grid-cols-5">
        {GAMES.map(([t, d], i) => (
          <motion.button
            key={t}
            ref={(el) => {
              openers.current[i] = el;
            }}
            type="button"
            onClick={() => setOpen(i)}
            whileHover={{ y: -6 }}
            className="group bg-paper p-6 text-left transition-colors duration-200 hover:bg-jade focus-visible:bg-jade"
          >
            <span aria-hidden className="mb-10 block h-10 w-12">
              <Icon className="h-full group-hover:hidden group-focus-visible:hidden" />
              <Icon dark className="hidden h-full group-hover:block group-focus-visible:block" />
            </span>
            <span className="block text-xl font-bold text-jade group-hover:text-mist group-focus-visible:text-mist">{t}</span>
            <span className="block text-small text-graphite group-hover:text-mist/80 group-focus-visible:text-mist/80">{d}</span>
            <span className="mt-4 inline-block text-small font-semibold text-emerald group-hover:text-luminous group-focus-visible:text-luminous">
              Jouer
            </span>
          </motion.button>
        ))}
      </div>
      {open !== null && <GameDialog id={open} title={GAMES[open][0]} onClose={close} />}
    </>
  );
}

/** The landing page's games section. */
export function Games() {
  return (
    <section id="jeux" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-28 md:px-10">
      <Reveal>
        <SectionTitle>Échauffe tes neurones.</SectionTitle>
      </Reveal>
      <div className="mt-12">
        <GameGrid />
      </div>
      <p className="mt-8 text-graphite">
        Avec classement et goodies à gagner : Codons et Glycémie 24 h, à partir du lundi 30 novembre sur la{" "}
        <Link href="/jeux" className="font-semibold text-emerald underline">
          page Jeux
        </Link>
        .
      </p>
    </section>
  );
}
