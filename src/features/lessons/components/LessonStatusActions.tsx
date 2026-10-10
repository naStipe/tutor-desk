"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button, LinkButton } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { setLessonPaymentAction, updateLessonStatusAction } from "../actions";
import {
  LESSON_STATUSES,
  type LessonStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "../schemas";
import { StatusBadge } from "./StatusBadge";

/** Window event the Move quick action fires; `LessonDetailsCard` opens its editor on the date/time. */
export const MOVE_LESSON_EVENT = "tutordesk:move-lesson";

const STATUS_ACTION_LABELS: Record<LessonStatus, string> = {
  scheduled: "Mark scheduled",
  completed: "Mark completed",
  cancelled: "Cancel lesson",
  no_show: "Mark no-show",
};

function PaymentQuickButton({ paid }: { paid: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} className="w-full">
      {paid ? "Mark unpaid" : "Mark paid"}
    </Button>
  );
}

export function LessonStatusActions({
  lessonId,
  initialStatus,
  meetingUrl,
  paymentStatus,
  paymentMethod,
}: {
  lessonId: string;
  initialStatus: LessonStatus;
  meetingUrl?: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [pendingStatus, setPendingStatus] = useState<LessonStatus | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runStatus(next: LessonStatus) {
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

  function applyStatus(next: LessonStatus) {
    if (next === "cancelled") {
      setConfirmingCancel(true);
      return;
    }
    runStatus(next);
  }

  const paid = paymentStatus === "paid";

  return (
    <>
      {/* Phone/tablet quick actions: the common ones, above the edit form and homework. */}
      <div className="grid grid-cols-2 gap-2 lg:hidden">
        {meetingUrl && (
          <LinkButton
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2"
          >
            Join meeting
          </LinkButton>
        )}
        {optimisticStatus !== "completed" && (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => applyStatus("completed")}
            className="w-full"
          >
            {pendingStatus === "completed" ? "Updating…" : "Mark completed"}
          </Button>
        )}
        <form action={setLessonPaymentAction}>
          <input type="hidden" name="id" value={lessonId} />
          <input type="hidden" name="paymentStatus" value={paid ? "unpaid" : "paid"} />
          {!paid && paymentMethod && (
            <input type="hidden" name="paymentMethod" value={paymentMethod} />
          )}
          <PaymentQuickButton paid={paid} />
        </form>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.dispatchEvent(new Event(MOVE_LESSON_EVENT))}
          className={optimisticStatus !== "completed" ? "col-span-2 w-full" : "w-full"}
        >
          Move
        </Button>
      </div>

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

      <ConfirmModal
        open={confirmingCancel}
        title="Cancel lesson?"
        message="Cancel this lesson?"
        confirmLabel="Cancel lesson"
        onCancel={() => setConfirmingCancel(false)}
        onConfirm={() => {
          setConfirmingCancel(false);
          runStatus("cancelled");
        }}
      />
    </>
  );
}
