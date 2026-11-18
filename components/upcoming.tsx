import Link from "next/link";
import type { ReactNode } from "react";
import { PageHero } from "./page-hero";
import { Facts } from "./ui/facts";
import { Stroke } from "./ui/stroke";

/** Page for a module that opens later: what it is, when it opens, what to do now. */
export function Upcoming({
  title,
  intro,
  opens,
  facts,
  children,
}: {
  title: string;
  intro: ReactNode;
  opens: string;
  facts: [ReactNode, ReactNode][];
  children?: ReactNode;
}) {
  return (
    <>
      <PageHero title={title} intro={intro}>
        <p className="mt-8 inline-flex items-center gap-3 font-semibold text-luminous">
          <Stroke />
          {opens}
        </p>
      </PageHero>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid max-w-measure content-start gap-4 text-lg text-ink">{children}</div>
        <aside>
          <Facts items={facts} />
          <p className="mt-6 border-t border-jade/15 pt-4 text-small text-graphite">
            Pas encore inscrit·e ?{" "}
            <Link href="/inscription" className="font-semibold text-emerald underline">
              S&apos;inscrire
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
