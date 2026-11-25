import { radarPoint, radarPolygon, type RadarSeries } from "@/lib/radar";

/*
 * Radar charts for the team builder. They sit on an Abyss panel: it is the only ground where
 * DESIGN.md has three colours that stay apart (Luminous, White, Stone). Danger is kept for errors,
 * so series 4 to 8 reuse the three colours with another outline and marker: dashed with hollow
 * squares, then dotted with diamonds. The legend shows the combination, and each chart carries
 * a table for screen readers.
 */
const COLORS = ["var(--color-luminous)", "var(--color-white)", "var(--color-stone)"];
const DASHES = [undefined, "7 4", "2 4"];
const RADIUS = 88;

function seriesStyle(i: number) {
  const variant = Math.floor(i / COLORS.length) % DASHES.length;
  return { color: COLORS[i % COLORS.length], dash: DASHES[variant], variant };
}

/** Vertex marker: filled square, hollow square or diamond. A dash alone disappears on a single-axis spike. */
function Marker({ x, y, color, variant }: { x: number; y: number; color: string; variant: number }) {
  return (
    <rect
      x={x - 2.5}
      y={y - 2.5}
      width={5}
      height={5}
      fill={variant === 1 ? "var(--color-abyss)" : color}
      stroke={color}
      strokeWidth={variant === 1 ? 1.5 : 0}
      transform={variant === 2 ? `rotate(45 ${x} ${y})` : undefined}
    />
  );
}

/** One polygon per series, values from 0 to 1 on each axis. `active` puts one series forward. */
export function RadarChart({
  title,
  axes,
  series,
  active = null,
}: {
  title: string;
  axes: readonly string[];
  series: RadarSeries[];
  active?: number | null;
}) {
  const n = axes.length;
  return (
    <figure className="min-w-0">
      <figcaption className="font-semibold text-white">{title}</figcaption>
      <svg
        viewBox="-180 -120 360 240"
        role="img"
        aria-label={`${title} : ${series.map((s) => s.name).join(", ")}`}
        className="mt-2 h-auto w-full"
      >
        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={radarPolygon(axes.map(() => ring), RADIUS)}
            fill="none"
            stroke="var(--color-mist)"
            strokeOpacity={ring === 1 ? 0.4 : 0.15}
          />
        ))}
        {axes.map((axis, i) => {
          const [x, y] = radarPoint(i, n, 1, RADIUS);
          const [lx, ly] = radarPoint(i, n, 1, RADIUS + 12);
          return (
            <g key={axis}>
              <line x1={0} y1={0} x2={x} y2={y} stroke="var(--color-mist)" strokeOpacity={0.15} />
              <text
                x={lx}
                y={ly}
                fontSize={11}
                fill="var(--color-mist)"
                fillOpacity={0.8}
                textAnchor={Math.abs(lx) < 1 ? "middle" : lx > 0 ? "start" : "end"}
                dominantBaseline={Math.abs(ly) < 1 ? "middle" : ly > 0 ? "hanging" : "auto"}
              >
                {axis}
              </text>
            </g>
          );
        })}
        {series.map((s, i) => {
          const { color, dash, variant } = seriesStyle(i);
          return (
            <g key={i} opacity={active !== null && active !== i ? 0.2 : 1}>
              <title>{s.name}</title>
              <polygon
                points={radarPolygon(s.values, RADIUS)}
                fill={color}
                fillOpacity={0.12}
                stroke={color}
                strokeWidth={active === i ? 2.5 : 1.75}
                strokeDasharray={dash}
                strokeLinejoin="round"
              />
              {s.values.map((v, axis) => {
                if (v <= 0) return null;
                const [x, y] = radarPoint(axis, n, v, RADIUS);
                return <Marker key={axis} x={x} y={y} color={color} variant={variant} />;
              })}
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Nom</th>
            {axes.map((axis) => (
              <th key={axis} scope="col">
                {axis}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.map((s, i) => (
            <tr key={i}>
              <th scope="row">{s.name}</th>
              {s.values.map((v, axis) => (
                <td key={axis}>{Math.round(v * 100)} %</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Names of the series, each with its line sample. Pressing a name puts that series forward. */
export function RadarLegend({
  names,
  hidden = 0,
  active,
  onActive,
}: {
  names: string[];
  hidden?: number;
  active: number | null;
  onActive: (i: number | null) => void;
}) {
  return (
    <div className="mt-4 border-t border-mist/20 pt-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {names.map((name, i) => {
          const { color, dash, variant } = seriesStyle(i);
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={active === i}
                onClick={() => onActive(active === i ? null : i)}
                className={`flex min-h-8 items-center gap-2 text-small ${active === i ? "font-semibold text-white" : "text-mist hover:text-white"}`}
              >
                <svg aria-hidden width="30" height="10" viewBox="0 0 30 10">
                  <line x1="0" y1="5" x2="30" y2="5" stroke={color} strokeWidth="2" strokeDasharray={dash} />
                  <Marker x={15} y={5} color={color} variant={variant} />
                </svg>
                {name}
              </button>
            </li>
          );
        })}
      </ul>
      {hidden > 0 && (
        <p className="mt-1 text-small text-mist/80">
          {hidden} autre{hidden > 1 ? "s" : ""} profil{hidden > 1 ? "s" : ""} non affiché{hidden > 1 ? "s" : ""} : le graphique
          en compare {names.length} au plus.
        </p>
      )}
    </div>
  );
}
