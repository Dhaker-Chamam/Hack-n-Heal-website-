import type { ReactNode } from "react";

/** Ruled key/value list, as in the landing page hero ("Où · INSAT, Tunis"). */
export function Facts({ items, tone = "light" }: { items: [ReactNode, ReactNode][]; tone?: "light" | "dark" }) {
  const rule = tone === "dark" ? "border-mist/20" : "border-jade/15";
  const key = tone === "dark" ? "text-stone" : "text-graphite";
  const val = tone === "dark" ? "text-mist" : "text-ink";
  return (
    <dl className="m-0">
      {items.map(([k, v], i) => (
        <div key={i} className={`border-t ${rule} py-3`}>
          <dt className={`t-label ${key}`}>{k}</dt>
          <dd className={`mt-0.5 font-semibold ${val}`}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
