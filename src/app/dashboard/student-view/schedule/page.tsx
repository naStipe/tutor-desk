import { redirect } from "next/navigation";
import { Card } from "../../../../components/Card";
import { EmptyState } from "../../../../components/EmptyState";
import { PageHeader } from "../../../../components/PageHeader";
import { StatusBadge } from "../../../../features/lessons/components/StatusBadge";
import { formatFullDateTime } from "../../../../features/lessons/date-utils";
import { listLessonsForStudent } from "../../../../features/lessons/data";
import { resolveViewedStudent } from "../../../../features/student-view/resolve";
import { cachedForTutor, tutorTag } from "../../../../lib/query-cache";
import { getCurrentUser } from "../../../../lib/supabase/current-user";
import { createTokenClient } from "../../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

export default async function StudentViewSchedulePage({
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
      <EmptyState
        title="No students yet"
        description="Add a student to preview what their schedule would look like."
      />
    );
  }

  const lessons = await cachedForTutor(
    "student-view-lessons",
    [user.id, selected.id],
    [tutorTag("lessons", user.id)],
    30,
    () => listLessonsForStudent(client, selected.id),
  );

  const now = Date.now();
  const upcoming = lessons
    .filter((lesson) => lesson.status !== "cancelled" && new Date(lesson.start_time).getTime() >= now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" description={`Upcoming lessons for ${selected.name}`} />

      {upcoming.length === 0 ? (
        <EmptyState
          title="No upcoming lessons"
          description={`${selected.name} doesn't have any lessons scheduled yet.`}
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {upcoming.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {formatFullDateTime(lesson.start_time)}
                </p>
                <p className="truncate text-sm text-ink-muted">{lesson.subject?.name ?? "General"}</p>
              </div>
              <StatusBadge status={lesson.status} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
