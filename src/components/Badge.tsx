import type { ReactNode } from "react";

export type BadgeTone = "brand" | "cyan" | "violet" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: "bg-brand/10 text-brand border-brand/25",
  cyan: "bg-cyan/10 text-cyan border-cyan/25",
  violet: "bg-violet/10 text-violet border-violet/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  neutral: "bg-surface-muted text-ink-muted border-border",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
