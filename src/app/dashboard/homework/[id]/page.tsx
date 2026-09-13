import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "../../../../components/Avatar";
import { PageHeader } from "../../../../components/PageHeader";
import { updateHomeworkAction } from "../../../../features/homework/actions";
import { FeedbackForm } from "../../../../features/homework/components/FeedbackForm";
import { HomeworkForm } from "../../../../features/homework/components/HomeworkForm";
import { HomeworkStatusBadge } from "../../../../features/homework/components/HomeworkStatusBadge";
import { SubmissionForm } from "../../../../features/homework/components/SubmissionForm";
import { getHomework } from "../../../../features/homework/data";
import { formatTimeRange } from "../../../../features/lessons/date-utils";
import { listLessonsForSelect } from "../../../../features/lessons/data";
import { listActiveStudents } from "../../../../features/students/data";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDueDate(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [homework, activeStudents, lessons] = await Promise.all([
    getHomework(supabase, id),
    listActiveStudents(supabase),
    listLessonsForSelect(supabase),
  ]);
  if (!homework) notFound();

  const students = activeStudents.some((student) => student.id === homework.student_id)
    ? activeStudents
    : [...(homework.student ? [homework.student] : []), ...activeStudents];

  const lessonOptions = lessons.map((lesson) => ({
    id: lesson.id,
    label: `${lesson.student?.name ?? "Unknown"} — ${new Date(lesson.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${formatTimeRange(lesson.start_time, lesson.end_time)}`,
  }));

  const dueLabel = formatDueDate(homework.due_date);

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title={homework.title}
        description={dueLabel ?? "No due date"}
        actions={
          <Link href="/dashboard/homework" className="text-sm text-slate-500 hover:text-slate-700">
            &larr; Back to homework
          </Link>
        }
      />

      <div className="flex items-center gap-3">
        <Avatar name={homework.student?.name ?? "?"} size="sm" />
        <span className="text-sm text-slate-600">
          {homework.student?.name ?? "Unknown student"}
        </span>
        <HomeworkStatusBadge status={homework.status} />
        {homework.lesson && (
          <Link
            href={`/dashboard/lessons/${homework.lesson.id}`}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View linked lesson &rarr;
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900">Edit details</h2>
        <div className="mt-4">
          <HomeworkForm
            action={updateHomeworkAction}
            homeworkId={homework.id}
            students={students}
            lessons={lessonOptions}
            defaultValues={{
              studentId: homework.student_id,
              lessonId: homework.lesson_id ?? "",
              title: homework.title,
              description: homework.description ?? "",
              dueDate: homework.due_date ?? "",
            }}
            submitLabel="Save changes"
            pendingLabel="Saving…"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900">Submission</h2>
        {homework.submission_text ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
            {homework.submission_text}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">Not submitted yet.</p>
        )}
        <div className="mt-4">
          <SubmissionForm homeworkId={homework.id} />
        </div>
      </div>

      {homework.status !== "assigned" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900">Feedback</h2>
          {homework.feedback_text ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {homework.feedback_text}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">No feedback yet.</p>
          )}
          <div className="mt-4">
            <FeedbackForm
              homeworkId={homework.id}
              defaultValue={homework.feedback_text ?? ""}
              label={homework.feedback_text ? "Update feedback" : "Leave feedback"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
