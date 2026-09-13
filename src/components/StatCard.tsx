import type { ComponentType, SVGProps } from "react";

const TONE_CLASSES = {
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}
