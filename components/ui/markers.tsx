/**
 * Square markers, borrowed from the sponsorship dossier (■□□ tier marks).
 * Drawn shapes, not glyphs.
 */
export function Squares({
  filled,
  total,
  tone = "light",
  label,
  size = "md",
}: {
  filled: number;
  total: number;
  tone?: "light" | "dark";
  label: string;
  size?: "sm" | "md";
}) {
  const on = tone === "dark" ? "bg-luminous border-luminous" : "bg-emerald border-emerald";
  const off = tone === "dark" ? "border-mist" : "border-graphite";
  const dim = size === "sm" ? "size-2.5" : "size-3.5";
  return (
    <span role="img" aria-label={label} className="inline-flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`${dim} border ${i < filled ? on : off}`} />
      ))}
    </span>
  );
}

export function StatusMarker({
  done,
  children,
  tone = "light",
}: {
  done: boolean;
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  const on = tone === "dark" ? "bg-luminous border-luminous" : "bg-emerald border-emerald";
  const off = tone === "dark" ? "border-mist" : "border-graphite";
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className={`size-2.5 border ${done ? on : off}`} />
      <span>{children}</span>
    </span>
  );
}
