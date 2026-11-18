"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

type Q = { q: string; o: string[]; a: number; why: string };

const QUIZ: Q[] = [
  { q: "Which of these is NOT a DNA base?", o: ["Adenine", "Uracil", "Guanine", "Cytosine"], a: 1, why: "Uracil replaces thymine in RNA." },
  { q: "What does the CNN in deep learning stand for?", o: ["Cellular Neural Network", "Convolutional Neural Network", "Clinical Node Network", "Computed Neuron Normalisation"], a: 1, why: "CNNs are widely used to analyse medical images." },
  { q: "Which organ produces insulin?", o: ["Liver", "Kidney", "Pancreas", "Spleen"], a: 2, why: "Beta cells in the pancreas make insulin." },
  { q: "In an autoimmune disease, the immune system attacks…", o: ["Only viruses", "The body's own tissues", "Only bacteria", "Nothing at all"], a: 1, why: "It loses the ability to tell self from non-self." },
  { q: "A model that memorises its training data but fails on new data is…", o: ["Underfitting", "Regularised", "Overfitting", "Normalised"], a: 2, why: "Held-out test data is how we catch it." },
  { q: "What is the tool BLAST mainly used for?", o: ["Comparing biological sequences", "Imaging tumours", "Training neural networks", "Editing genes"], a: 0, why: "It searches databases for similar DNA or protein sequences." },
];
const CONNECT: Q[] = [
  { q: "Tumour · MRI · segmentation", o: ["Medical imaging AI", "Astronomy", "Cryptography", "Game design"], a: 0, why: "Models outline tumours on scans to support radiologists." },
  { q: "FASTA · alignment · genome", o: ["Web design", "Bioinformatics", "Robotics", "Accounting"], a: 1, why: "FASTA is a standard text format for sequences." },
  { q: "T-cells · antibodies · lupus", o: ["Compilers", "Orthopaedics", "Autoimmunity", "Networking"], a: 2, why: "All three come up in autoimmune research." },
  { q: "Neurons · layers · weights", o: ["Deep learning", "Pharmacy", "Genetics", "Radiology"], a: 0, why: "The same words describe artificial and biological networks." },
];
const AIH: Q[] = [
  { q: "“As we delve into the multifaceted tapestry of cellular biology, a rich landscape of interconnected pathways emerges.”", o: ["AI", "Human"], a: 0, why: "Grand, vague and full of stock phrases." },
  { q: "“my pipeline crashed at 3am because I forgot to normalise the counts. never again.”", o: ["AI", "Human"], a: 1, why: "Specific, messy and personal." },
  { q: "“In conclusion, combining AI and bioinformatics is a transformative paradigm shift across the healthcare ecosystem.”", o: ["AI", "Human"], a: 0, why: "Big claims, no concrete detail." },
  { q: "“The mouse colony got moved again, so the experiment is delayed two weeks. Coffee isn't helping.”", o: ["AI", "Human"], a: 1, why: "Lived detail and a bit of humour." },
];
const BIO = ["ATGAAACCC", "GGATTACAT", "CTTAGGATC"];
const FACTS = ["ATG is the start codon: it begins almost every protein.", "RNA uses uracil (U) where DNA uses thymine (T).", "Transcription copies a gene into messenger RNA."];

function Quiz({ qs, intro }: { qs: Q[]; intro?: string }) {
  const [i, setI] = useState(0), [p, setP] = useState<number | null>(null), [s, setS] = useState(0), [done, setDone] = useState(false);
  const q = qs[i];
  const reset = () => { setI(0); setP(null); setS(0); setDone(false); };
  if (done) return (
    <div><p className="text-5xl font-extrabold text-lumi">{s}/{qs.length}</p>
      <p className="mt-3 text-mist/80">{s === qs.length ? "Perfect round." : s >= qs.length / 2 ? "Solid. One more round?" : "Good warm-up. Try again."}</p>
      <button onClick={reset} className="mt-6 bg-lumi px-5 py-3 text-sm font-semibold text-abyss">Play again</button></div>
  );
  return (
    <div>
      <p className="text-sm text-stone">Question {i + 1} of {qs.length}{intro ? ` · ${intro}` : ""}</p>
      <h3 className="mt-3 text-xl font-bold leading-snug text-mist md:text-2xl">{q.q}</h3>
      <div className={`mt-6 grid gap-2 ${q.o.length > 2 ? "sm:grid-cols-2" : "grid-cols-2"}`}>
        {q.o.map((o, n) => {
          const right = p !== null && n === q.a, wrong = p === n && n !== q.a;
          return (
            <button key={o} disabled={p !== null} onClick={() => { setP(n); if (n === q.a) setS(s + 1); }}
              className={`flex items-center justify-between gap-2 border px-4 py-3 text-left text-sm font-medium transition ${right ? "border-lumi bg-lumi text-abyss" : wrong ? "border-stone bg-graphite text-mist" : "border-mist/25 text-mist hover:bg-mist/10"}`}>
              {o}{right && <Check size={16} />}{wrong && <X size={16} />}</button>
          );
        })}
      </div>
      {p !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
          <p className="text-sm text-mist/80">{p === q.a ? "Correct. " : "Not quite. "}{q.why}</p>
          <button onClick={() => { if (i + 1 < qs.length) { setI(i + 1); setP(null); } else setDone(true); }} className="mt-4 bg-lumi px-5 py-3 text-sm font-semibold text-abyss">{i + 1 < qs.length ? "Next" : "See score"}</button>
        </motion.div>
      )}
    </div>
  );
}

function Bio() {
  const [i, setI] = useState(0), [v, setV] = useState(""), [res, setRes] = useState<"" | "ok" | "no">(""), [s, setS] = useState(0), [done, setDone] = useState(false);
  const ans = BIO[i]?.replace(/T/g, "U");
  if (done) return <div><p className="text-5xl font-extrabold text-lumi">{s}/{BIO.length}</p><p className="mt-3 text-mist/80">Sequences transcribed.</p>
    <button onClick={() => { setI(0); setV(""); setRes(""); setS(0); setDone(false); }} className="mt-6 bg-lumi px-5 py-3 text-sm font-semibold text-abyss">Play again</button></div>;
  const check = () => { const ok = v.trim().toUpperCase() === ans; setRes(ok ? "ok" : "no"); if (ok) setS(s + 1); };
  return (
    <div>
      <p className="text-sm text-stone">Sequence {i + 1} of {BIO.length}. Transcribe this DNA coding strand into mRNA. Hint: T becomes U.</p>
      <p className="mt-4 break-all text-3xl font-bold tracking-[0.25em] text-lumi">{BIO[i]}</p>
      <div className="mt-6 flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)} disabled={res !== ""} maxLength={9} aria-label="Your mRNA answer" placeholder="Type the mRNA"
          className="w-full border border-mist/30 bg-transparent px-4 py-3 tracking-[0.2em] text-mist placeholder:tracking-normal placeholder:text-stone" />
        {res === "" && <button onClick={check} className="bg-lumi px-5 text-sm font-semibold text-abyss">Check</button>}
      </div>
      {res !== "" && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
        <p className="text-sm text-mist/80">{res === "ok" ? "Correct. " : `Not quite. The answer is ${ans}. `}{FACTS[i]}</p>
        <button onClick={() => { if (i + 1 < BIO.length) { setI(i + 1); setV(""); setRes(""); } else setDone(true); }} className="mt-4 bg-lumi px-5 py-3 text-sm font-semibold text-abyss">{i + 1 < BIO.length ? "Next sequence" : "See score"}</button></motion.div>}
    </div>
  );
}

export function GameModal({ id, title, onClose }: { id: number | null; title: string; onClose: () => void }) {
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [onClose]);
  if (id === null) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose} className="fixed inset-0 z-[60] grid place-items-center bg-abyss/90 p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} onClick={(e) => e.stopPropagation()} className="max-h-[90svh] w-full max-w-2xl overflow-y-auto bg-jade p-6 md:p-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-mist md:text-3xl">{title}</h2>
          <button autoFocus onClick={onClose} aria-label="Close game" className="text-mist hover:text-lumi"><X /></button>
        </div>
        {id === 0 && <Quiz qs={QUIZ} />}
        {id === 1 && <Quiz qs={CONNECT} intro="What field links these words?" />}
        {id === 2 && <Quiz qs={AIH} intro="Written by an AI or a human? These examples were written for this game." />}
        {id === 3 && <Bio />}
      </motion.div>
    </div>
  );
}
