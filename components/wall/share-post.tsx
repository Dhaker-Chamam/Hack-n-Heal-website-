"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "../ui/button";

/** Copy the address of a post, or send it on WhatsApp: likes come from the people it is shared with. */
export function SharePost({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={copy} className={buttonClass("secondary", "sm")}>
          {copied ? <Check aria-hidden className="size-4" strokeWidth={2} /> : <Copy aria-hidden className="size-4" strokeWidth={1.75} />}
          {copied ? "Lien copié" : "Copier le lien"}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
          <Share2 aria-hidden className="size-4" strokeWidth={1.75} />
          Partager sur WhatsApp
        </a>
      </div>
      <p className="tabular mt-3 select-all break-all text-small text-graphite">{url}</p>
      <p aria-live="polite" className="sr-only">
        {copied ? "Lien copié dans le presse-papiers" : ""}
      </p>
    </div>
  );
}
