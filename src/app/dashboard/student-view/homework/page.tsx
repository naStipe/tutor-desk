import { redirect } from "next/navigation";
import { Card } from "../../../../components/Card";
import { EmptyState } from "../../../../components/EmptyState";
import { PageHeader } from "../../../../components/PageHeader";
import { HomeworkStatusBadge } from "../../../../features/homework/components/HomeworkStatusBadge";
import { listHomework } from "../../../../features/homework/data";
import { resolveViewedStudent } from "../../../../features/student-view/resolve";
import { getTutorFormatSettings } from "../../../../features/tutor-profile/data";
import { cachedForTutor, tutorTag } from "../../../../lib/query-cache";
import { getCurrentUser } from "../../../../lib/supabase/current-user";
import { createTokenClient } from "../../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

// due_date is a calendar date with no time-of-day, so it's parsed and displayed in UTC rather
// than any particular timezone, keeping the date stable regardless of the viewer's clock.
function formatDueDate(value: string | null, locale: string) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00Z`);
  const todayUtcMidnight = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const isOverdue = date.getTime() < todayUtcMidnight.getTime();
  const label = date.toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  return isOverdue ? `Overdue · ${label}` : `Due ${label}`;
}

export default async function StudentViewHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student: studentParam } = await searchParams;
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;
  const { selected } = await resolveViewedStudent(client, studentParam);

  if (!selected) {
    return (
      <EmptyState title="No students yet" description="Add a student to preview their homework." />
    );
  }

  const [homework, { locale }] = await Promise.all([
    cachedForTutor(
      "student-view-homework",
      [user.id, selected.id],
      [tutorTag("homework", user.id)],
      30,
      () => listHomework(client, { studentId: selected.id, limit: 100 }),
    ),
    getTutorFormatSettings(client, user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Homework" description={`Assignments for ${selected.name}`} />

      {homework.length === 0 ? (
        <EmptyState
          title="No homework yet"
          description={`${selected.name} doesn't have any homework assigned.`}
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {homework.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                <p className="truncate text-sm text-ink-muted">
                  {item.subject?.name ? `${item.subject.name} · ` : ""}
                  {formatDueDate(item.due_date, locale)}
                </p>
                {item.status === "reviewed" && item.feedback_text && (
                  <p className="mt-1 truncate text-sm text-ink-muted">
                    Feedback: {item.feedback_text}
                  </p>
                )}
              </div>
              <HomeworkStatusBadge status={item.status} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
