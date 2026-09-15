import { redirect } from "next/navigation";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeader } from "../../../components/PageHeader";
import { PaymentBadge } from "../../../features/lessons/components/PaymentBadge";
import { StatusBadge } from "../../../features/lessons/components/StatusBadge";
import { formatFullDateTime } from "../../../features/lessons/date-utils";
import { listLessonsForStudent } from "../../../features/lessons/data";
import { requirePortalStudent } from "../../../features/portal/resolve";
import { getTutorFormatSettings } from "../../../features/tutor-profile/data";
import { getCurrentUser } from "../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

export default async function PortalLessonsPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const student = await requirePortalStudent(supabase, user.id);

  const [lessons, { timeZone, locale }] = await Promise.all([
    listLessonsForStudent(supabase, student.id),
    getTutorFormatSettings(supabase, student.tutor_id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Lessons" description="Your lesson history" />

      {lessons.length === 0 ? (
        <EmptyState title="No lessons yet" description="You have no lessons on record yet." />
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
                    {formatFullDateTime(lesson.start_time, timeZone, locale)}
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
