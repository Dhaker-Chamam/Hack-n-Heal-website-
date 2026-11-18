"use client";

import { motion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { BRACKETS, ICON_VIEWBOX, iconColors, STEM, STROKE } from "@/components/brand/logo";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Honours prefers-reduced-motion for every animation of the landing page. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Rise-and-fade as the block enters the viewport, once. */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** The workshops timeline: a Luminous line that grows downwards. */
export function GrowLine({ className = "" }: { className?: string }) {
  return (
    <motion.div
      aria-hidden
      initial={{ scaleY: 0 }}
      whileInView={{ scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.8, ease: "easeInOut" }}
      className={`origin-top ${className}`}
    />
  );
}

/** The symbol drawing itself: brackets first, then the stem, then its branches. */
export function DrawnIcon({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const c = iconColors(dark);
  const delays = [0, 0.1, 0.5, 1.4, 1.7];
  const paths = [...BRACKETS.map((d) => ({ d, stroke: c.bracket })), ...STEM.map((d) => ({ d, stroke: c.stem }))];
  return (
    <svg viewBox={ICON_VIEWBOX} aria-hidden className={className}>
      {paths.map((p, i) => (
        <motion.path
          key={p.d}
          d={p.d}
          stroke={p.stroke}
          {...STROKE}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, delay: delays[i], ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
    </svg>
  );
}
