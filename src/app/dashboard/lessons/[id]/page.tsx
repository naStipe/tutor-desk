import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "../../../../components/Avatar";
import { Button } from "../../../../components/Button";
import { Card } from "../../../../components/Card";
import { ConfirmSubmitForm } from "../../../../components/ConfirmSubmitForm";
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
import { formatFullDateTime } from "../../../../features/lessons/date-utils";
import { getLesson } from "../../../../features/lessons/data";
import {
  type LessonStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PAYMENT_STATUSES,
} from "../../../../features/lessons/schemas";
import { listHomeworkForLesson } from "../../../../features/homework/data";
import { getTutorFormatSettings } from "../../../../features/tutor-profile/data";
import { formatMoney } from "../../../../lib/formatting";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const supabase = await createClient();

  const [lesson, lessonHomework] = await Promise.all([
    getLesson(supabase, id),
    listHomeworkForLesson(supabase, id),
  ]);
  if (!lesson) notFound();

  const { timeZone, locale } = await getTutorFormatSettings(supabase, lesson.tutor_id);

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
          studentName={lesson.student?.name ?? "Unknown student"}
          subjectName={lesson.subject?.name ?? null}
          timeZone={timeZone}
          locale={locale}
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
          locale={locale}
        />
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Payment</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {lesson.price !== null && lesson.currency
              ? formatMoney(lesson.price, lesson.currency, locale)
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
          <ConfirmSubmitForm
            action={cancelSeriesAction}
            confirmMessage="Cancel all remaining lessons in this series? Past and completed lessons are not affected."
            label="Cancel remaining lessons in this series"
          >
            <input type="hidden" name="seriesId" value={lesson.series_id} />
            <input type="hidden" name="lessonId" value={lesson.id} />
          </ConfirmSubmitForm>
        </Card>
      )}
    </div>
  );
}
