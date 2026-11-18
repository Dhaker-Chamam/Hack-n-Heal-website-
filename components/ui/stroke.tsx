/** The landing page's 30° stroke, cut from the logo's arms: a bullet and a marker. */
export function Stroke({ tone = "dark", className = "" }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-1 w-5 shrink-0 -rotate-[30deg] ${tone === "dark" ? "bg-luminous" : "bg-emerald"} ${className}`}
    />
  );
}
