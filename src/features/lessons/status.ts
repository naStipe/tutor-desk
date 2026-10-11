import type { LessonStatus } from "./schemas";

/** Stored statuses plus the derived "in progress" (a scheduled lesson whose time is now). */
export type DisplayStatus = LessonStatus | "in_progress";

/**
 * What to show for a lesson at `nowMs`. The database only stores `scheduled`, `completed`,
 * `cancelled` and `no_show`; a scheduled lesson is shown as in progress between its start and end,
 * and as completed once its end has passed (the stored value is caught up by
 * `complete_elapsed_lessons`).
 */
export function displayStatus(
  status: string,
  startTime: string,
  endTime: string,
  nowMs: number,
): DisplayStatus {
  if (status !== "scheduled") return status as LessonStatus;
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (Number.isNaN(start) || Number.isNaN(end)) return "scheduled";
  if (nowMs >= end) return "completed";
  if (nowMs >= start) return "in_progress";
  return "scheduled";
}
