import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "../../../../components/Avatar";
import { Button } from "../../../../components/Button";
import { Card } from "../../../../components/Card";
import { PageHeader } from "../../../../components/PageHeader";
import {
  cancelSeriesAction,
  setLessonPaymentAction,
  updateLessonAction,
} from "../../../../features/lessons/actions";
import { LessonDetailsCard } from "../../../../features/lessons/components/LessonDetailsCard";
import { LessonHomeworkCard } from "../../../../features/lessons/components/LessonHomeworkCard";
import { LessonStatusActions } from "../../../../features/lessons/components/LessonStatusActions";
import { PaymentBadge } from "../../../../features/lessons/components/PaymentBadge";
import { Select } from "../../../../components/Select";
import { addDays, formatFullDateTime, startOfDay } from "../../../../features/lessons/date-utils";
import { getLesson, listLessonsInRange } from "../../../../features/lessons/data";
import { buildRatesByStudent } from "../../../../features/lessons/rates-map";
import {
  type LessonStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PAYMENT_STATUSES,
} from "../../../../features/lessons/schemas";
import { listHomeworkForLesson } from "../../../../features/homework/data";
import { listRatesForTutor } from "../../../../features/rates/data";
import { listActiveStudents } from "../../../../features/students/data";
import { listSubjects } from "../../../../features/subjects/data";
import { getTutorTimezone } from "../../../../features/tutor-profile/data";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const supabase = await createClient();
  const pickerStart = addDays(startOfDay(new Date()), -7);
  const pickerEnd = addDays(startOfDay(new Date()), 120);

  const [lesson, activeStudents, subjects, rates, pickerLessonRows, lessonHomework] =
    await Promise.all([
      getLesson(supabase, id),
      listActiveStudents(supabase),
      listSubjects(supabase),
      listRatesForTutor(supabase),
      listLessonsInRange(supabase, {
        start: pickerStart.toISOString(),
        end: pickerEnd.toISOString(),
      }),
      listHomeworkForLesson(supabase, id),
    ]);
  if (!lesson) notFound();

  const timeZone = await getTutorTimezone(supabase, lesson.tutor_id);

  const pickerLessons = pickerLessonRows.map((row) => ({
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
  }));

  const students = activeStudents.some((student) => student.id === lesson.student_id)
    ? activeStudents
    : [...(lesson.student ? [lesson.student] : []), ...activeStudents];

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title={lesson.student?.name ?? "Lesson"}
        description={formatFullDateTime(lesson.start_time, timeZone)}
        avatar={<Avatar name={lesson.student?.name ?? "?"} />}
        actions={
          <Link href="/dashboard/lessons" className="text-sm text-ink-muted hover:text-ink">
            &larr; Back to lessons
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted">Payment</span>
          <PaymentBadge status={lesson.payment_status} />
        </div>
      </div>

      <LessonStatusActions lessonId={lesson.id} initialStatus={lesson.status as LessonStatus} />

      <Card>
        <LessonDetailsCard
          action={updateLessonAction}
          lessonId={lesson.id}
          students={students}
          subjects={subjects}
          ratesByStudent={buildRatesByStudent(rates, activeStudents)}
          pickerLessons={pickerLessons}
          studentName={lesson.student?.name ?? "Unknown student"}
          subjectName={subjects.find((subject) => subject.id === lesson.subject_id)?.name ?? null}
          defaultValues={{
            studentId: lesson.student_id,
            subjectId: lesson.subject_id ?? undefined,
            startTimeIso: lesson.start_time,
            durationMinutes: Math.round(
              (new Date(lesson.end_time).getTime() - new Date(lesson.start_time).getTime()) / 60000,
            ),
            notes: lesson.notes ?? "",
            meetingUrl: lesson.meeting_url ?? undefined,
            price: lesson.price !== null ? String(lesson.price) : undefined,
            currency: lesson.currency ?? undefined,
            paymentStatus: lesson.payment_status as (typeof PAYMENT_STATUSES)[number],
            paymentMethod: (lesson.payment_method ?? undefined) as
              | (typeof PAYMENT_METHODS)[number]
              | undefined,
          }}
        />
      </Card>

      <Card>
        <LessonHomeworkCard
          lessonId={lesson.id}
          studentId={lesson.student_id}
          homework={lessonHomework}
        />
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
            <Select
              name="paymentMethod"
              defaultValue={lesson.payment_method ?? "invoice"}
              className="flex w-40 items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-border-strong focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-brand/25"
              options={PAYMENT_METHODS.map((method) => ({
                value: method,
                label: PAYMENT_METHOD_LABELS[method],
              }))}
            />
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
