import type { CSSProperties } from "react";

/**
 * Hack'n'Heal symbol and horizontal lockup, from the landing page design.
 * Rebuilt from the guidelines' construction (u = 8 = stroke, 30° arms, flat terminals):
 * replace with the delivered SVG files (hack-n-heal-icon.svg, -lockup.svg) when they arrive.
 * Light grounds: Deep Jade brackets, Emerald stem. Dark grounds: Mist brackets, Luminous stem.
 */
export const ICON_VIEWBOX = "0 0 96 80";
export const BRACKETS = ["M30 6 L10.4 40 L30 74", "M66 6 L85.6 40 L66 74"] as const;
export const STEM = ["M48 74 V6", "M48 58 L59.5 38", "M48 44 L36.5 24"] as const;
export const STROKE = { fill: "none", strokeWidth: 8, strokeLinejoin: "miter", strokeLinecap: "butt" } as const;

export function iconColors(dark: boolean) {
  return dark ? { bracket: "#E6EFEC", stem: "#3FBF9C" } : { bracket: "#0A3F42", stem: "#0B7A5E" };
}

export function Icon({
  dark = false,
  className = "",
  style,
  label,
}: {
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  const c = iconColors(dark);
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg viewBox={ICON_VIEWBOX} className={className} style={style} {...a11y}>
      {BRACKETS.map((d) => (
        <path key={d} d={d} stroke={c.bracket} {...STROKE} />
      ))}
      {STEM.map((d) => (
        <path key={d} d={d} stroke={c.stem} {...STROKE} />
      ))}
    </svg>
  );
}

/**
 * Icon left of the wordmark, gap 5u, wordmark in Plus Jakarta Sans SemiBold capitals tracked +130.
 * `size` is the icon height in px; at 18 or more the lockup is wider than its 112px minimum.
 * Decorative: the link around it carries the accessible name.
 */
export function Lockup({ dark = false, size = 28 }: { dark?: boolean; size?: number }) {
  return (
    <span aria-hidden className="inline-flex items-center" style={{ gap: size * 0.6 }}>
      <Icon dark={dark} className="block w-auto shrink-0" style={{ height: size }} />
      <span
        className="whitespace-nowrap font-semibold uppercase leading-none"
        style={{ fontSize: size * 0.6, letterSpacing: "0.13em", color: dark ? "#E6EFEC" : "#0A3F42" }}
      >
        Hack N Heal
      </span>
    </span>
  );
}
