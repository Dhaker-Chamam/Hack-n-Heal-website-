import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "on-dark" | "outline-dark";
type Size = "md" | "sm";

// Square, semibold, lifts 2px on hover: the landing page's button.
const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-[background-color,color,border-color,transform] duration-200 ease-[var(--ease-out-quart)] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  // Light grounds. White on Emerald 5.3:1; hover moves to Deep Jade (11.6:1)
  primary: "bg-emerald text-white hover:bg-jade active:bg-abyss",
  secondary: "border border-jade text-jade hover:bg-jade hover:text-paper",
  ghost: "text-emerald underline-offset-4 hover:underline px-0! motion-safe:hover:translate-y-0",
  danger: "bg-danger text-white hover:bg-[#8f1c13]",
  // Dark grounds only. Abyss on Luminous 6.7:1
  "on-dark": "bg-luminous text-abyss hover:bg-mist",
  "outline-dark": "border border-mist/40 text-mist hover:bg-mist/10",
};

const sizes: Record<Size, string> = {
  md: "min-h-12 px-6 text-small",
  sm: "min-h-10 px-4 text-small",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
