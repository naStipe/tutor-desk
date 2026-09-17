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
    if (next === "cancelled" && !window.confirm("Cancel this lesson?")) return;
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

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-ink">Status</span>
        <span className={`transition-opacity duration-150 ${isPending ? "opacity-60" : ""}`}>
          <StatusBadge status={optimisticStatus} />
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {LESSON_STATUSES.filter((value) => value !== optimisticStatus).map((value) => (
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
  );
}
