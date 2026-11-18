"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "./ui/button";

/** Team code with copy and WhatsApp share, the signature interaction of the team page. */
export function CopyCode({ code, shareText }: { code: string; shareText: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div>
      <p className="tabular select-all text-[2.5rem] font-bold leading-none tracking-[0.06em] text-jade md:text-5xl">{code}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={copy} className={buttonClass("secondary", "sm")}>
          {copied ? (
            <Check aria-hidden className="size-4" strokeWidth={2} />
          ) : (
            <Copy aria-hidden className="size-4" strokeWidth={1.75} />
          )}
          {copied ? "Code copié" : "Copier le code"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
          className={buttonClass("secondary", "sm")}
        >
          <Share2 aria-hidden className="size-4" strokeWidth={1.75} />
          Partager sur WhatsApp
        </a>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Code copié dans le presse-papiers" : ""}
      </p>
    </div>
  );
}
