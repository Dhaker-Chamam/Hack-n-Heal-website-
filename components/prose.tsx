import type { ReactNode } from "react";
import { PageHero } from "./page-hero";

/** Long-form reading layout for the rules and the privacy notice. */
export function Prose({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHero size="headline" title={title}>
        <p className="mt-4 text-small text-stone">Version du {updated}</p>
      </PageHero>
      <article className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <div className="prose-hnh">{children}</div>
      </article>
    </>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-jade/15 pb-10 pt-8 first:border-t-0 first:pt-0">
      <h2 id={id} className="t-subhead">
        {title}
      </h2>
      <div className="mt-4 grid max-w-measure gap-3 text-ink [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_li]:marker:text-emerald [&_ul]:grid [&_ul]:gap-2">
        {children}
      </div>
    </section>
  );
}
