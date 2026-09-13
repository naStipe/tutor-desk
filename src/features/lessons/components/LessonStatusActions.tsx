"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { updateLessonStatusAction } from "../actions";
import { LESSON_STATUSES, type LessonStatus } from "../schemas";
import { StatusBadge } from "./StatusBadge";

const STATUS_ACTION_LABELS: Record<LessonStatus, string> = {
  scheduled: "Mark scheduled",
  completed: "Mark completed",
  cancelled: "Cancel lesson",
  no_show: "Mark no-show",
};

export function LessonStatusActions({
  lessonId,
  initialStatus,
}: {
  lessonId: string;
  initialStatus: LessonStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [pendingStatus, setPendingStatus] = useState<LessonStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyStatus(next: LessonStatus) {
    setPendingStatus(next);
    startTransition(async () => {
      setOptimisticStatus(next);
      try {
        await updateLessonStatusAction(lessonId, next);
        setStatus(next);
      } finally {
        setPendingStatus(null);
      }
    });
  }

  const otherStatuses = LESSON_STATUSES.filter((value) => value !== optimisticStatus);

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-muted">Status</span>
        <span className={`transition-opacity duration-150 ${isPending ? "opacity-60" : ""}`}>
          <StatusBadge status={optimisticStatus} />
        </span>
      </div>
      <Card>
        <h2 className="text-sm font-semibold text-ink">Update status</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Mark this lesson completed, cancelled, or no-show as its outcome becomes known.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {otherStatuses.map((value) => (
            <Button
              key={value}
              type="button"
              variant={value === "cancelled" ? "danger" : "secondary"}
              disabled={isPending}
              onClick={() => applyStatus(value)}
              className={pendingStatus === value ? "opacity-70" : ""}
            >
              {pendingStatus === value ? "Updating…" : STATUS_ACTION_LABELS[value]}
            </Button>
          ))}
        </div>
      </Card>
    </>
  );
}
