"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Lockup } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { DrawnIcon, EASE } from "./motion";

const SECTIONS = [
  { id: "a-propos", label: "À propos" },
  { id: "competitions", label: "Compétitions" },
  { id: "themes", label: "Thèmes" },
  { id: "ateliers", label: "Ateliers" },
  { id: "jeux", label: "Jeux" },
  { id: "faq", label: "FAQ" },
];

/** Fixed over the hero; takes the Abyss ground once the page scrolls, so it stays legible over light sections. */
export function LandingNav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`on-dark fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid ? "bg-abyss" : "bg-transparent"}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-10">
        <a href="#top" aria-label="Hack'n'Heal 2026, haut de page" className="shrink-0 py-1">
          <Lockup dark size={22} />
        </a>
        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex gap-7 text-small">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-mist/80 hover:text-luminous">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-5">
          <Link href="/moi" className="hidden text-small text-mist/80 hover:text-luminous sm:block">
            Mon espace
          </Link>
          <Link href="/inscription" className={buttonClass("on-dark", "sm")}>
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  return (
    <section id="top" className="on-dark relative min-h-[100svh] overflow-hidden bg-abyss pb-12 pt-28">
      <motion.div
        style={{ y, width: "min(88vw, 68vh, 700px)" }}
        aria-hidden
        className="pointer-events-none absolute -right-[12vw] top-[11vh] opacity-40 md:right-[3vw] md:opacity-95"
      >
        <DrawnIcon dark className="w-full" />
      </motion.div>
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-10rem)] max-w-7xl flex-col justify-end px-5 md:px-10">
        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.9, ease: EASE }}
          className="text-[clamp(3.4rem,13vw,11.5rem)] font-extrabold leading-[0.88] tracking-[-0.03em] text-mist"
        >
          Hack
          <br />N Heal
        </motion.h1>
        <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-end">
          <div>
            <p className="text-2xl font-semibold text-luminous md:text-3xl">Là où la technologie rencontre le vivant.</p>
            <p className="mt-3 max-w-md text-mist/80">
              Une expérience interdisciplinaire qui réunit médecine, bioinformatique et intelligence artificielle pour ouvrir de
              nouvelles pistes en santé.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/inscription" className={buttonClass("on-dark")}>
                S&apos;inscrire
              </Link>
              <a href="#a-propos" className={buttonClass("outline-dark")}>
                Découvrir l&apos;événement
              </a>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-6 border-t border-mist/20 pt-5 text-mist md:ml-auto md:w-[24rem]">
            <div>
              <dt className="text-label text-stone">Où</dt>
              <dd className="font-semibold">INSAT, Tunis</dd>
            </div>
            <div>
              <dt className="text-label text-stone">Quand</dt>
              <dd className="font-semibold">5 et 6 décembre 2026</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
