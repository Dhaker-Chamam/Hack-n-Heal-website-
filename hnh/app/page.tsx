"use client";
import { useState } from "react";
import { motion, MotionConfig, useScroll, useTransform } from "framer-motion";
import { Plus, ArrowUpRight, Linkedin, Instagram } from "lucide-react";
import { Icon, Lockup } from "@/components/Logo";
import { GameModal } from "@/components/Games";

const REG = "#register", EASE = [0.22, 1, 0.36, 1] as const;
const R = ({ children, d = 0, className = "" }: { children: React.ReactNode; d?: number; className?: string }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, delay: d, ease: EASE }}>{children}</motion.div>
);
const Btn = ({ href, children, ghost, dark }: { href: string; children: React.ReactNode; ghost?: boolean; dark?: boolean }) => (
  <a href={href} className={`inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${ghost ? (dark ? "border border-mist/40 text-mist hover:bg-mist/10" : "border border-jade text-jade hover:bg-jade hover:text-paper") : "bg-lumi text-abyss hover:bg-mist"}`}>{children}</a>
);
const H = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <h2 className={`text-[clamp(2.2rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.02em] ${dark ? "text-mist" : "text-jade"}`}>{children}</h2>
);

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-4 md:px-10 mix-blend-normal">
      <a href="#top" aria-label="Hack N Heal home"><Lockup dark size={24} /></a>
      <nav className="hidden gap-7 text-sm text-mist/80 md:flex" aria-label="Sections">
        {["about", "challenges", "themes", "workshops", "faq"].map((s) => <a key={s} href={`#${s}`} className="capitalize hover:text-lumi">{s}</a>)}
      </nav>
      <a href={REG} className="bg-lumi px-4 py-2 text-sm font-semibold text-abyss">Register</a>
    </header>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden bg-abyss px-5 pb-12 pt-28 md:px-10">
      <motion.div style={{ y, width: "min(88vw, 68vh, 700px)" }} aria-hidden className="pointer-events-none absolute -right-[12vw] top-[11vh] opacity-95 md:right-[3vw]"><Icon dark animate className="w-full" /></motion.div>
      <div className="relative z-10 flex min-h-[calc(100svh-10rem)] flex-col justify-end">
        <motion.h1 initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.9, ease: EASE }}
          className="text-[clamp(3.4rem,13vw,11.5rem)] font-extrabold leading-[0.88] tracking-[-0.03em] text-mist">Hack<br />N Heal</motion.h1>
        <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-end">
          <div>
            <p className="text-2xl font-semibold text-lumi md:text-3xl">Where technology meets life.</p>
            <p className="mt-3 max-w-md text-mist/80">An interdisciplinary experience bringing together Medicine, Bioinformatics and Artificial Intelligence to explore new possibilities in healthcare.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Btn href={REG}>Register now</Btn><Btn href="#about" ghost dark>Explore the event</Btn></div>
          </div>
          <dl className="grid grid-cols-2 gap-6 border-t border-mist/20 pt-5 text-mist md:ml-auto md:w-[22rem]">
            <div><dt className="text-xs text-stone">Where</dt><dd className="font-semibold">INSAT, Tunis</dd></div>
            <div><dt className="text-xs text-stone">When</dt><dd className="font-semibold">Date to be announced</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}

const disc = [
  { k: "Medicine", t: "Real clinical questions, and the judgement to know which ones matter.", x: 150, y: 140, c: "#0B7A5E" },
  { k: "Bioinformatics", t: "Biological data turned into something a model can learn from.", x: 270, y: 140, c: "#3FBF9C" },
  { k: "Artificial Intelligence", t: "Methods that find patterns no one could read by hand.", x: 210, y: 240, c: "#E6EFEC" },
];
function About() {
  const [a, setA] = useState<number | null>(null);
  return (
    <section id="about" className="mx-auto grid max-w-7xl gap-12 px-5 py-28 md:grid-cols-2 md:px-10">
      <div>
        <R><H>Different disciplines. One shared mission.</H></R>
        <R d={0.1}><p className="mt-6 max-w-md text-lg text-graphite">Hack N Heal brings Medicine, Bioinformatics and Artificial Intelligence into one room at INSAT to tackle real healthcare challenges. Preparatory workshops come first, so everyone arrives ready to work across fields.</p></R>
        <ul className="mt-8 space-y-3">
          {disc.map((d, i) => (
            <li key={d.k}><button onMouseEnter={() => setA(i)} onFocus={() => setA(i)} onMouseLeave={() => setA(null)} onBlur={() => setA(null)} className={`w-full border-l-4 py-2 pl-4 text-left transition ${a === i ? "border-emerald" : "border-mist"}`}>
              <span className="block font-semibold text-jade">{d.k}</span><span className="text-sm text-graphite">{d.t}</span></button></li>
          ))}
        </ul>
      </div>
      <R className="self-center">
        <svg viewBox="0 0 420 380" className="w-full" role="img" aria-label="Medicine, Bioinformatics and AI overlapping at healthcare">
          <rect width="420" height="380" fill="#06292B" />
          {disc.map((d, i) => <circle key={d.k} cx={d.x + 0} cy={d.y} r={a === i ? 98 : 90} fill={d.c} fillOpacity={a === null || a === i ? 0.55 : 0.2} style={{ mixBlendMode: "screen", transition: "all .4s" }} />)}
          <text x="150" y="105" fill="#E6EFEC" fontSize="13" fontWeight="600" textAnchor="middle">Medicine</text>
          <text x="285" y="105" fill="#06292B" fontSize="13" fontWeight="600" textAnchor="middle">Bioinformatics</text>
          <text x="210" y="300" fill="#06292B" fontSize="13" fontWeight="600" textAnchor="middle">AI</text>
          <g transform="translate(192,150)"><svg width="36" height="30" viewBox="0 0 96 80"><path d="M48 74V6M48 58L59.5 38M48 44L36.5 24" stroke="#06292B" strokeWidth="9" fill="none" /></svg></g>
          <text x="210" y="198" fill="#06292B" fontSize="11" fontWeight="700" textAnchor="middle">Healthcare</text>
        </svg>
      </R>
    </section>
  );
}

function Challenges() {
  const C = [
    { n: "The Hackathon", t: "Collaborate, think beyond academic boundaries and build innovative solutions to real healthcare challenges.", bg: "bg-emerald text-paper", tag: "Teams · Build · Pitch" },
    { n: "The Deep Learning Competition", t: "A challenge exploring what Deep Learning can do for medicine and the biological sciences.", bg: "bg-jade text-mist", tag: "Data · Models · Results" },
  ];
  return (
    <section id="challenges" className="bg-mist py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-10"><R><H>Two challenges. One day.</H></R></div>
      <div className="mx-auto mt-12 grid max-w-7xl gap-4 px-5 md:grid-cols-2 md:px-10">
        {C.map((c, i) => (
          <R key={c.n} d={i * 0.12}>
            <article className={`group relative flex min-h-[26rem] flex-col justify-between overflow-hidden p-8 ${c.bg} ${i ? "md:mt-16" : ""}`}>
              <div aria-hidden className="absolute -right-10 -top-10 w-64 opacity-15 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110" style={{ transform: `rotate(${i ? -8 : 8}deg)` }}><Icon dark className="w-full" /></div>
              <p className="relative text-sm opacity-80">{c.tag}</p>
              <div className="relative"><h3 className="text-3xl font-bold leading-tight md:text-4xl">{c.n}</h3><p className="mt-4 max-w-sm opacity-90">{c.t}</p></div>
            </article>
          </R>
        ))}
      </div>
    </section>
  );
}

const themes = [
  { n: "Cancer", s: "Cure & Prevention", t: "The contribution of AI, biological data and computational methods to cancer research, prevention and treatment." },
  { n: "Autoimmune Diseases", s: "Understanding the body against itself", t: "How computational biology, medical research and AI can deepen the investigation of autoimmune diseases." },
  { n: "Modern-Day Medicine", s: "Healthcare, transformed", t: "AI, personalized medicine, intelligent diagnostic support and data-driven research reshaping care." },
];
function Themes() {
  return (
    <section id="themes" className="mx-auto max-w-7xl px-5 py-28 md:px-10">
      <R><H>Three questions worth solving.</H></R>
      <ol className="mt-14 divide-y divide-jade/15 border-y border-jade/15">
        {themes.map((t, i) => (
          <li key={t.n}><R><div className="group grid items-center gap-4 py-10 transition-colors hover:bg-mist/60 md:grid-cols-[6rem_1.3fr_1fr] md:px-4">
            <span className="text-5xl font-extrabold text-emerald/30 transition group-hover:text-emerald">0{i + 1}</span>
            <div><h3 className="text-3xl font-bold text-jade md:text-5xl">{t.n}</h3><p className="mt-1 font-medium text-emerald">{t.s}</p></div>
            <p className="text-graphite">{t.t}</p></div></R></li>
        ))}
      </ol>
    </section>
  );
}

const steps = [["Artificial Intelligence", "The core ideas behind learning from data."], ["Deep Learning", "Neural networks, from first principles to practice."], ["Bioinformatics", "Working with biological datasets."], ["Medical applications of AI", "Where models meet clinical reality."], ["Interdisciplinary problem-solving", "Working across fields, as a team."]];
function Workshops() {
  return (
    <section id="workshops" className="relative overflow-hidden bg-abyss px-5 py-28 md:px-10">
      <div className="mx-auto max-w-7xl">
        <R><H dark>Learn. Explore. Prepare.</H></R>
        <R d={0.1}><p className="mt-5 max-w-lg text-mist/80">Preparatory workshops run before the main event. Schedule and format will be announced by the organizers.</p></R>
        <div className="relative mt-16 pl-8 md:pl-0">
          <motion.div aria-hidden initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 1.8, ease: "easeInOut" }} className="absolute bottom-0 left-2 top-0 w-1 origin-top bg-lumi md:left-1/2" />
          {steps.map(([t, d], i) => (
            <R key={t}><div className={`relative mb-10 md:w-1/2 ${i % 2 ? "md:ml-auto md:pl-12" : "md:pr-12 md:text-right"}`}>
              <span aria-hidden className={`absolute top-3 h-5 w-1 bg-lumi ${i % 2 ? "-left-6 md:-left-0" : "-left-6 md:-right-0 md:left-auto"}`} style={{ width: 28, height: 4, transform: `rotate(${i % 2 ? -30 : 30}deg)`, left: undefined }} />
              <h3 className="text-2xl font-semibold text-mist">{t}</h3><p className="text-mist/70">{d}</p></div></R>
          ))}
          <R><p className="font-semibold text-lumi md:text-center">…then Hack N Heal.</p></R>
        </div>
      </div>
    </section>
  );
}

const gain = [
  { k: "Computer Science & Engineering", q: "Go beyond building technology. Build technology that matters.", p: ["Discover AI applications in STEM and healthcare.", "Understand real medical and biological problems.", "Explore Machine Learning and Deep Learning applications.", "Learn how to collaborate with medical and biological students."], note: "" },
  { k: "Medicine", q: "Technology is a tool. Medical expertise gives it direction.", p: ["Discover how AI can assist medical research and clinical decision-making.", "Understand the possibilities and limitations of AI in healthcare.", "Explore how medical knowledge guides useful technological solutions.", "Discover how doctors and engineers can collaborate."], note: "AI is not about replacing doctors. It supports medical expertise and opens new possibilities in healthcare." },
  { k: "Biology & Bioinformatics", q: "Turn biological knowledge into computational possibilities.", p: ["Discover hands-on applications of Bioinformatics.", "Explore the analysis of biological datasets.", "Understand how Machine Learning can support biological research.", "Learn how computational tools and biological expertise complement one another."], note: "AI needs biological knowledge to produce meaningful scientific results." },
];
function Gain() {
  const [i, setI] = useState(0); const g = gain[i];
  return (
    <section className="bg-jade px-5 py-28 md:px-10">
      <div className="mx-auto max-w-7xl">
        <R><H dark>Your discipline is your starting point, not your limit.</H></R>
        <div role="tablist" aria-label="Choose your discipline" className="mt-12 flex flex-wrap gap-2">
          {gain.map((x, n) => <button key={x.k} role="tab" aria-selected={i === n} onClick={() => setI(n)} className={`px-5 py-3 text-sm font-semibold transition ${i === n ? "bg-lumi text-abyss" : "border border-mist/30 text-mist hover:bg-mist/10"}`}>{x.k}</button>)}
        </div>
        <motion.div key={i} role="tabpanel" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE }} className="mt-10 grid gap-10 md:grid-cols-2">
          <p className="text-3xl font-bold leading-tight text-mist md:text-4xl">{g.q}</p>
          <div><ul className="space-y-4">{g.p.map((p) => <li key={p} className="flex gap-3 text-mist/90"><span aria-hidden className="mt-2 h-1 w-5 shrink-0 -rotate-[30deg] bg-lumi" />{p}</li>)}</ul>
            {g.note && <p className="mt-8 border-l-4 border-lumi pl-4 font-medium text-lumi">{g.note}</p>}</div>
        </motion.div>
      </div>
    </section>
  );
}

function Organizers() {
  return (
    <section className="border-y border-jade/15 bg-mist px-5 py-16 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_2fr]">
        <R><h2 className="text-3xl font-bold text-jade">Brought together by a shared vision.</h2></R>
        <div className="grid gap-6 sm:grid-cols-2">
          {[["Symbio", "Description of the club to be provided."], ["Android Club INSAT", "Description of the club to be provided."]].map(([n, d]) => (
            <R key={n}><div className="flex gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center bg-paper text-xs text-stone">Logo</div><div><h3 className="font-bold text-jade">{n}</h3><p className="text-sm text-graphite">{d}</p></div></div></R>
          ))}
        </div>
      </div>
    </section>
  );
}

const games = [["Scientific Quiz", "Test what you know."], ["Guess the Connection", "Link the fields."], ["AI or Human?", "Spot who wrote it."], ["Bioinformatics Challenge", "Decode a sequence."]];
function Games() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="games" className="mx-auto max-w-7xl px-5 py-28 md:px-10">
      <R><H>Warm up your brain.</H></R>
      <div className="mt-12 grid gap-px bg-jade/15 sm:grid-cols-2 lg:grid-cols-4">
        {games.map(([t, d], i) => (
          <motion.button key={t} onClick={() => setOpen(i)} whileHover={{ y: -6 }} className="group bg-paper p-6 text-left hover:bg-jade">
            <div aria-hidden className="mb-10 h-10 w-12"><span className="block h-full group-hover:hidden"><Icon className="h-full" /></span><span className="hidden h-full group-hover:block"><Icon dark className="h-full" /></span></div>
            <h3 className="text-xl font-bold text-jade group-hover:text-mist">{t}</h3><p className="text-sm text-graphite group-hover:text-mist/80">{d}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-emerald group-hover:text-lumi">Play</span>
          </motion.button>
        ))}
      </div>
      <GameModal id={open} title={open === null ? "" : games[open][0]} onClose={() => setOpen(null)} />
    </section>
  );
}

const faqs = [
  ["What is Hack N Heal?", "An interdisciplinary event at INSAT bringing together Medicine, Bioinformatics and AI to explore healthcare challenges."],
  ["Who can participate?", "Students from computer science, engineering, medicine, biology and bioinformatics. Eligibility details to be confirmed."],
  ["Where will the event take place?", "At INSAT, Tunisia. Exact venue details to be confirmed."],
  ["Can I participate in both competitions?", "To be confirmed by the organizers."],
  ["Do I need to come with a team?", "To be confirmed by the organizers."],
  ["What are the workshops about?", "AI, Deep Learning, Bioinformatics, medical applications of AI and interdisciplinary problem-solving."],
  ["How do I register?", "Registration link coming soon."],
  ["How does the Hackathon submission work?", "Submission process to be announced."],
  ["Will workshops be online or in person?", "Format to be announced."],
];
function FAQ() {
  const [o, setO] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto grid max-w-7xl gap-10 px-5 pb-28 md:grid-cols-[1fr_1.6fr] md:px-10">
      <div><R><H>Any questions?</H></R><div className="mt-6"><Btn href="mailto:contact@example.com" ghost>Contact us</Btn></div></div>
      <div className="divide-y divide-jade/15 border-y border-jade/15">
        {faqs.map(([q, a], i) => (
          <div key={q}><button onClick={() => setO(o === i ? null : i)} aria-expanded={o === i} className="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-semibold text-jade">{q}
            <Plus className={`shrink-0 text-emerald transition-transform ${o === i ? "rotate-45" : ""}`} /></button>
            <motion.div initial={false} animate={{ height: o === i ? "auto" : 0, opacity: o === i ? 1 : 0 }} className="overflow-hidden"><p className="pb-5 text-graphite">{a}</p></motion.div></div>
        ))}
      </div>
    </section>
  );
}

function Final() {
  return (
    <footer id="register" className="relative overflow-hidden bg-abyss px-5 pb-8 pt-28 md:px-10">
      <div aria-hidden className="absolute -bottom-24 right-0 w-[60vw] max-w-xl opacity-20"><Icon dark className="w-full" /></div>
      <div className="relative mx-auto max-w-7xl">
        <R><h2 className="max-w-4xl text-[clamp(2.4rem,7vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.02em] text-mist">The future of healthcare is interdisciplinary.</h2></R>
        <p className="mt-6 max-w-md text-mist/80">Bring your knowledge. Discover new perspectives. Be part of the intersection.</p>
        <div className="mt-8"><Btn href="#register">Register now</Btn></div>
        <div className="mt-24 flex flex-wrap items-center justify-between gap-6 border-t border-mist/15 pt-6 text-sm text-stone">
          <Lockup dark size={22} />
          <p>INSAT, Tunisia · Symbio × Android Club INSAT</p>
          <div className="flex gap-4 text-mist">{[Instagram, Linkedin].map((I, k) => <a key={k} href="#" aria-label="Social link placeholder" className="hover:text-lumi"><I size={18} /></a>)}<ArrowUpRight size={0} /></div>
        </div>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <MotionConfig reducedMotion="user">
      <Nav /><main><Hero /><About /><Challenges /><Themes /><Workshops /><Gain /><Organizers /><Games /><FAQ /></main><Final />
    </MotionConfig>
  );
}
