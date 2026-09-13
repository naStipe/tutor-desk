import type { ReactNode } from "react";

export type BadgeTone = "blue" | "emerald" | "slate" | "amber" | "violet";

const TONE_CLASSES: Record<BadgeTone, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  slate: "bg-slate-100 text-slate-500 border-slate-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
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
