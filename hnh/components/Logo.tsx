"use client";
import { motion } from "framer-motion";
// Rebuilt from the guideline construction (u=8, 30° arms, flat terminals). Swap for the delivered SVGs when available.
export function Icon({ dark = false, animate = false, className = "" }: { dark?: boolean; animate?: boolean; className?: string }) {
  const b = dark ? "#E6EFEC" : "#0A3F42", s = dark ? "#3FBF9C" : "#0B7A5E";
  const P = animate ? motion.path : "path";
  const a = (d: number) => animate ? { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1.6, delay: d, ease: [0.65, 0, 0.35, 1] } } : {};
  const c = { fill: "none", strokeWidth: 8, strokeLinejoin: "miter" as const, strokeLinecap: "butt" as const };
  return (
    <svg viewBox="0 0 96 80" role="img" aria-label="Hack N Heal symbol" className={className}>
      <P d="M30 6 L10.4 40 L30 74" stroke={b} {...c} {...(a(0) as object)} />
      <P d="M66 6 L85.6 40 L66 74" stroke={b} {...c} {...(a(0.1) as object)} />
      <P d="M48 74 V6" stroke={s} {...c} {...(a(0.5) as object)} />
      <P d="M48 58 L59.5 38" stroke={s} {...c} {...(a(1.4) as object)} />
      <P d="M48 44 L36.5 24" stroke={s} {...c} {...(a(1.7) as object)} />
    </svg>
  );
}
export function Lockup({ dark = false, size = 28 }: { dark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.6 }}>
      <span style={{ height: size, display: "block" }}><Icon dark={dark} className="h-full w-auto" /></span>
      <span className="font-semibold uppercase" style={{ fontSize: size * 0.6, letterSpacing: "0.13em", color: dark ? "#E6EFEC" : "#0A3F42" }}>Hack N Heal</span>
    </span>
  );
}
