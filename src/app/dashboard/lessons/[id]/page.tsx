import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "../../../../components/Avatar";
import { Button } from "../../../../components/Button";
import { Card } from "../../../../components/Card";
import { PageHeader } from "../../../../components/PageHeader";
import { setLessonStatusAction, updateLessonAction } from "../../../../features/lessons/actions";
import { LessonForm } from "../../../../features/lessons/components/LessonForm";
import { StatusBadge } from "../../../../features/lessons/components/StatusBadge";
import { formatFullDateTime, toDateTimeLocalValue } from "../../../../features/lessons/date-utils";
import { getLesson } from "../../../../features/lessons/data";
import { LESSON_STATUSES, type LessonStatus } from "../../../../features/lessons/schemas";
import { listActiveStudents } from "../../../../features/students/data";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_ACTION_LABELS: Record<LessonStatus, string> = {
  scheduled: "Mark scheduled",
  completed: "Mark completed",
  cancelled: "Cancel lesson",
  no_show: "Mark no-show",
};

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [lesson, activeStudents] = await Promise.all([
    getLesson(supabase, id),
    listActiveStudents(supabase),
  ]);
  if (!lesson) notFound();

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

      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-muted">Status</span>
        <StatusBadge status={lesson.status} />
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Edit details</h2>
        <div className="mt-4">
          <LessonForm
            action={updateLessonAction}
            lessonId={lesson.id}
            students={students}
            defaultValues={{
              studentId: lesson.student_id,
              startTime: toDateTimeLocalValue(lesson.start_time),
              endTime: toDateTimeLocalValue(lesson.end_time),
              notes: lesson.notes ?? "",
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
    </div>
  );
}
