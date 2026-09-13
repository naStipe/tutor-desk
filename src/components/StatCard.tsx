import type { ComponentType, SVGProps } from "react";
import { Card } from "./Card";

const TONE_CLASSES = {
  brand: "bg-brand/12 text-brand",
  cyan: "bg-cyan/12 text-cyan",
  violet: "bg-violet/12 text-violet",
  warning: "bg-warning/12 text-warning",
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
    <Card className="flex items-start gap-4 p-5 transition-shadow hover:shadow-md hover:shadow-black/[0.04]">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-ink">{value}</p>
      </div>
    </Card>
  );
}
