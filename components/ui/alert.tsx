import { Check, CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "info" | "success" | "error";

const tones: Record<Tone, { box: string; icon: ReactNode }> = {
  info: {
    box: "bg-mist text-ink",
    icon: <Info aria-hidden className="size-5 shrink-0 text-jade" strokeWidth={1.75} />,
  },
  success: {
    box: "bg-mist text-ink",
    icon: <Check aria-hidden className="size-5 shrink-0 text-emerald" strokeWidth={2} />,
  },
  error: {
    box: "bg-white text-ink border border-danger",
    icon: <CircleAlert aria-hidden className="size-5 shrink-0 text-danger" strokeWidth={1.75} />,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  role,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  role?: "alert" | "status";
}) {
  const t = tones[tone];
  return (
    <div role={role ?? (tone === "error" ? "alert" : undefined)} className={`flex gap-3 px-4 py-3.5 ${t.box}`}>
      <span className="mt-0.5">{t.icon}</span>
      <div className="min-w-0">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className={title ? "mt-0.5 text-graphite" : "text-ink"}>{children}</div>}
      </div>
    </div>
  );
}
