import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "../../../../components/Avatar";
import { Card } from "../../../../components/Card";
import { PageHeader } from "../../../../components/PageHeader";
import { updateHomeworkAction } from "../../../../features/homework/actions";
import { AttachmentsCard } from "../../../../features/homework/components/AttachmentsCard";
import { FeedbackForm } from "../../../../features/homework/components/FeedbackForm";
import { HomeworkForm } from "../../../../features/homework/components/HomeworkForm";
import { HomeworkStatusBadge } from "../../../../features/homework/components/HomeworkStatusBadge";
import { SubmissionForm } from "../../../../features/homework/components/SubmissionForm";
import {
  getHomework,
  getSignedAttachmentUrl,
  listAttachments,
} from "../../../../features/homework/data";
import { formatTimeRange } from "../../../../features/lessons/date-utils";
import { listLessonsForSelect } from "../../../../features/lessons/data";
import { listActiveStudents } from "../../../../features/students/data";
import { listSubjects } from "../../../../features/subjects/data";
import { getTutorFormatSettings } from "../../../../features/tutor-profile/data";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

// due_date is a calendar date with no time-of-day, so it's parsed and displayed in UTC rather
// than the tutor's timezone — that keeps the date stable regardless of the host runtime's own
// timezone, instead of risking an off-by-one-day shift. Locale still affects word order/casing.
function formatDueDate(value: string | null, locale: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [homework, activeStudents, lessons, subjects] = await Promise.all([
    getHomework(supabase, id),
    listActiveStudents(supabase),
    listLessonsForSelect(supabase),
    listSubjects(supabase),
  ]);
  if (!homework) notFound();

  const { timeZone, locale } = await getTutorFormatSettings(supabase, homework.tutor_id);

  const attachmentRows = await listAttachments(supabase, homework.id);
  const attachments = await Promise.all(
    attachmentRows.map(async (attachment) => ({
      id: attachment.id,
      file_name: attachment.file_name,
      size_bytes: attachment.size_bytes,
      content_type: attachment.content_type,
      url: await getSignedAttachmentUrl(supabase, attachment.storage_path).catch(() => null),
    })),
  );

  const students = activeStudents.some((student) => student.id === homework.student_id)
    ? activeStudents
    : [...(homework.student ? [homework.student] : []), ...activeStudents];

  const lessonOptions = lessons.map((lesson) => ({
    id: lesson.id,
    label: `${lesson.student?.name ?? "Unknown"} — ${new Date(lesson.start_time).toLocaleDateString(locale, { month: "short", day: "numeric", timeZone })}, ${formatTimeRange(lesson.start_time, lesson.end_time, timeZone, locale)}`,
  }));

  const links = (homework.links as { label: string | null; url: string }[] | null) ?? [];
  const linksText = links
    .map((link) => (link.label ? `${link.label} | ${link.url}` : link.url))
    .join("\n");

  const dueLabel = formatDueDate(homework.due_date, locale);

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title={homework.title}
        description={dueLabel ?? "No due date"}
        actions={
          <Link href="/dashboard/homework" className="text-sm text-ink-muted hover:text-ink">
            &larr; Back to homework
          </Link>
        }
      />

      <div className="flex items-center gap-3">
        <Avatar name={homework.student?.name ?? "?"} size="sm" />
        <span className="text-sm text-ink-muted">
          {homework.student?.name ?? "Unknown student"}
        </span>
        <HomeworkStatusBadge status={homework.status} />
        {homework.subject && (
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-ink-muted">
            {homework.subject.name}
          </span>
        )}
        {homework.lesson && (
          <Link
            href={`/dashboard/lessons/${homework.lesson.id}`}
            className="text-sm text-brand hover:text-brand-strong"
          >
            View linked lesson &rarr;
          </Link>
        )}
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Edit details</h2>
        <div className="mt-4">
          <HomeworkForm
            action={updateHomeworkAction}
            homeworkId={homework.id}
            students={students}
            lessons={lessonOptions}
            subjects={subjects}
            locale={locale}
            defaultValues={{
              studentId: homework.student_id,
              lessonId: homework.lesson_id ?? "",
              subjectId: homework.subject_id ?? "",
              title: homework.title,
              description: homework.description ?? "",
              dueDate: homework.due_date ?? "",
              links: linksText,
            }}
            submitLabel="Save changes"
            pendingLabel="Saving…"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Files</h2>
        <div className="mt-4">
          <AttachmentsCard homeworkId={homework.id} attachments={attachments} />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Submission</h2>
        {homework.submission_text ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
            {homework.submission_text}
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-subtle">Not submitted yet.</p>
        )}
        <div className="mt-4">
          <SubmissionForm homeworkId={homework.id} />
        </div>
      </Card>

      {homework.status !== "assigned" && (
        <Card>
          <h2 className="text-sm font-semibold text-ink">Feedback</h2>
          {homework.feedback_text ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
              {homework.feedback_text}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-subtle">No feedback yet.</p>
          )}
          <div className="mt-4">
            <FeedbackForm
              homeworkId={homework.id}
              defaultValue={homework.feedback_text ?? ""}
              label={homework.feedback_text ? "Update feedback" : "Leave feedback"}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
