import type { LessonStatus } from "../schemas";

const STATUS_STYLES: Record<LessonStatus, string> = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  no_show: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_LABELS: Record<LessonStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function StatusBadge({ status }: { status: LessonStatus | string }) {
  const key = (status in STATUS_STYLES ? status : "scheduled") as LessonStatus;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[key]}`}
    >
      {STATUS_LABELS[key]}
    </span>
  );
}
