import type { ReactNode } from "react";
import { Icon } from "./brand/logo";

/** Abyss band under the header, as the landing page's hero: extra-bold title, Mist text, the symbol faded at the edge. */
export function PageHero({
  title,
  intro,
  children,
  size = "display",
}: {
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  size?: "display" | "headline";
}) {
  return (
    <section className="on-dark relative overflow-hidden bg-abyss text-mist">
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-16 w-72 opacity-[0.12] md:right-6 md:w-96">
        <Icon dark className="w-full" />
      </div>
      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-8 md:pb-16 md:pt-12">
        <h1 className={`${size === "display" ? "t-display" : "t-headline"} max-w-4xl text-mist`}>{title}</h1>
        {intro && <div className="mt-5 max-w-2xl text-lg text-mist/80">{intro}</div>}
        {children}
      </div>
    </section>
  );
}
