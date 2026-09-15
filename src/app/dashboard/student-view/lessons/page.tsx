import { redirect } from "next/navigation";
import { Card } from "../../../../components/Card";
import { EmptyState } from "../../../../components/EmptyState";
import { PageHeader } from "../../../../components/PageHeader";
import { PaymentBadge } from "../../../../features/lessons/components/PaymentBadge";
import { StatusBadge } from "../../../../features/lessons/components/StatusBadge";
import { formatFullDateTime } from "../../../../features/lessons/date-utils";
import { listLessonsForStudent } from "../../../../features/lessons/data";
import { resolveViewedStudent } from "../../../../features/student-view/resolve";
import { getTutorFormatSettings } from "../../../../features/tutor-profile/data";
import { cachedForTutor, tutorTag } from "../../../../lib/query-cache";
import { getCurrentUser } from "../../../../lib/supabase/current-user";
import { createTokenClient } from "../../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

export default async function StudentViewLessonsPage({
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
        description="Add a student to preview their lesson history."
      />
    );
  }

  const [lessons, { timeZone }] = await Promise.all([
    cachedForTutor(
      "student-view-lessons",
      [user.id, selected.id],
      [tutorTag("lessons", user.id)],
      30,
      () => listLessonsForStudent(client, selected.id),
    ),
    getTutorFormatSettings(client, user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Lessons" description={`Every lesson for ${selected.name}`} />

      {lessons.length === 0 ? (
        <EmptyState
          title="No lessons yet"
          description={`${selected.name} has no lessons on record.`}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 text-ink">
                    {formatFullDateTime(lesson.start_time, timeZone)}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{lesson.subject?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lesson.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={lesson.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
