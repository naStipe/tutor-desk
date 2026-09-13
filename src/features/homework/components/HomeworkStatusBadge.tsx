import { Badge, type BadgeTone } from "../../../components/Badge";
import type { HomeworkStatus } from "../schemas";

const STATUS_TONES: Record<HomeworkStatus, BadgeTone> = {
  assigned: "slate",
  submitted: "amber",
  reviewed: "emerald",
};

const STATUS_LABELS: Record<HomeworkStatus, string> = {
  assigned: "Assigned",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

export function HomeworkStatusBadge({ status }: { status: HomeworkStatus | string }) {
  const key = (status in STATUS_TONES ? status : "assigned") as HomeworkStatus;
  return <Badge tone={STATUS_TONES[key]}>{STATUS_LABELS[key]}</Badge>;
}
