import { Badge, type BadgeTone } from "../../../components/Badge";
import type { LessonStatus } from "../schemas";

const STATUS_TONES: Record<LessonStatus, BadgeTone> = {
  scheduled: "blue",
  completed: "emerald",
  cancelled: "slate",
  no_show: "amber",
};

const STATUS_LABELS: Record<LessonStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function StatusBadge({ status }: { status: LessonStatus | string }) {
  const key = (status in STATUS_TONES ? status : "scheduled") as LessonStatus;
  return <Badge tone={STATUS_TONES[key]}>{STATUS_LABELS[key]}</Badge>;
}
