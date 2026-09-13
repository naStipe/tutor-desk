import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "../../../../components/Avatar";
import { Button } from "../../../../components/Button";
import { Card } from "../../../../components/Card";
import { PageHeader } from "../../../../components/PageHeader";
import {
  cancelSeriesAction,
  setLessonPaymentAction,
  setLessonStatusAction,
  updateLessonAction,
} from "../../../../features/lessons/actions";
import { LessonForm } from "../../../../features/lessons/components/LessonForm";
import { PaymentBadge } from "../../../../features/lessons/components/PaymentBadge";
import { StatusBadge } from "../../../../features/lessons/components/StatusBadge";
import {
  addDays,
  formatFullDateTime,
  minutesSinceMidnight,
  startOfDay,
  toDateParam,
} from "../../../../features/lessons/date-utils";
import { getLesson, listLessonsInRange } from "../../../../features/lessons/data";
import { buildRatesByStudent } from "../../../../features/lessons/rates-map";
import {
  LESSON_STATUSES,
  PAYMENT_METHODS,
  type LessonStatus,
} from "../../../../features/lessons/schemas";
import { listRatesForTutor } from "../../../../features/rates/data";
import { listActiveStudents } from "../../../../features/students/data";
import { listSubjects } from "../../../../features/subjects/data";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_ACTION_LABELS: Record<LessonStatus, string> = {
  scheduled: "Mark scheduled",
  completed: "Mark completed",
  cancelled: "Cancel lesson",
  no_show: "Mark no-show",
};

const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  online: "Online (coming soon)",
  invoice: "Invoice",
  sbp: "SBP transfer",
};

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [lesson, activeStudents, subjects, rates] = await Promise.all([
    getLesson(supabase, id),
    listActiveStudents(supabase),
    listSubjects(supabase),
    listRatesForTutor(supabase),
  ]);
  if (!lesson) notFound();

  const pickerStart = addDays(startOfDay(new Date()), -7);
  const pickerEnd = addDays(startOfDay(new Date()), 120);
  const pickerLessonRows = await listLessonsInRange(supabase, {
    start: pickerStart.toISOString(),
    end: pickerEnd.toISOString(),
  });
  const pickerLessons = pickerLessonRows.map((row) => ({
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
  }));

  const students = activeStudents.some((student) => student.id === lesson.student_id)
    ? activeStudents
    : [...(lesson.student ? [lesson.student] : []), ...activeStudents];

  const otherStatuses = LESSON_STATUSES.filter((status) => status !== lesson.status);

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title={lesson.student?.name ?? "Lesson"}
        description={formatFullDateTime(lesson.start_time)}
        avatar={<Avatar name={lesson.student?.name ?? "?"} />}
        actions={
          <Link href="/dashboard/lessons" className="text-sm text-ink-muted hover:text-ink">
            &larr; Back to lessons
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted">Status</span>
          <StatusBadge status={lesson.status} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted">Payment</span>
          <PaymentBadge status={lesson.payment_status} />
        </div>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Edit details</h2>
        <div className="mt-4">
          <LessonForm
            action={updateLessonAction}
            lessonId={lesson.id}
            students={students}
            subjects={subjects}
            ratesByStudent={buildRatesByStudent(rates)}
            pickerLessons={pickerLessons}
            defaultValues={{
              studentId: lesson.student_id,
              subjectId: lesson.subject_id ?? undefined,
              dateParam: toDateParam(new Date(lesson.start_time)),
              minutes: minutesSinceMidnight(new Date(lesson.start_time)),
              durationMinutes: Math.round(
                (new Date(lesson.end_time).getTime() - new Date(lesson.start_time).getTime()) /
                  60000,
              ),
              notes: lesson.notes ?? "",
              price: lesson.price !== null ? String(lesson.price) : undefined,
              currency: lesson.currency ?? undefined,
            }}
            submitLabel="Save changes"
            pendingLabel="Saving…"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Update status</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Mark this lesson completed, cancelled, or no-show as its outcome becomes known.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {otherStatuses.map((status) => (
            <form key={status} action={setLessonStatusAction}>
              <input type="hidden" name="id" value={lesson.id} />
              <input type="hidden" name="status" value={status} />
              <Button type="submit" variant={status === "cancelled" ? "danger" : "secondary"}>
                {STATUS_ACTION_LABELS[status]}
              </Button>
            </form>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Payment</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {lesson.price !== null
              ? `${lesson.price} ${lesson.currency ?? ""}`.trim()
              : "No price set for this lesson."}
            {lesson.payment_method &&
              ` · ${PAYMENT_METHOD_LABELS[lesson.payment_method as (typeof PAYMENT_METHODS)[number]]}`}
          </p>
        </div>

        {lesson.payment_status === "paid" ? (
          <form action={setLessonPaymentAction}>
            <input type="hidden" name="id" value={lesson.id} />
            <input type="hidden" name="paymentStatus" value="unpaid" />
            <Button type="submit" variant="secondary">
              Mark unpaid
            </Button>
          </form>
        ) : (
          <form action={setLessonPaymentAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={lesson.id} />
            <input type="hidden" name="paymentStatus" value="paid" />
            <select
              name="paymentMethod"
              defaultValue={lesson.payment_method ?? "invoice"}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </select>
            <Button type="submit">Mark paid</Button>
          </form>
        )}
      </Card>

      {lesson.series_id && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Recurring lesson</h2>
          <p className="text-sm text-ink-muted">
            This lesson is part of a weekly series. Cancelling the series stops future occurrences
            without touching past or completed lessons.
          </p>
          <form action={cancelSeriesAction}>
            <input type="hidden" name="seriesId" value={lesson.series_id} />
            <input type="hidden" name="lessonId" value={lesson.id} />
            <Button type="submit" variant="danger">
              Cancel remaining lessons in this series
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
