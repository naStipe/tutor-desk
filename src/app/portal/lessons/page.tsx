import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeader } from "../../../components/PageHeader";
import { PaymentBadge } from "../../../features/lessons/components/PaymentBadge";
import { StatusBadge } from "../../../features/lessons/components/StatusBadge";
import { formatFullDateTime } from "../../../features/lessons/date-utils";
import { countPortalLessons, listPortalLessons } from "../../../features/portal/data";
import { requirePortalStudent } from "../../../features/portal/resolve";
import { getTutorFormatSettings } from "../../../features/tutor-profile/data";
import { formatMoney } from "../../../lib/formatting";
import { getCurrentUser } from "../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function PortalLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; page?: string }>;
}) {
  const { student: studentId, page: pageParam } = await searchParams;
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const student = await requirePortalStudent(supabase, studentId);

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [lessons, totalCount, { timeZone, locale }] = await Promise.all([
    listPortalLessons(supabase, student.id, undefined, PAGE_SIZE, (page - 1) * PAGE_SIZE),
    countPortalLessons(supabase, student.id),
    getTutorFormatSettings(supabase, student.tutor_id),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (studentId) params.set("student", studentId);
    params.set("page", String(target));
    return `/portal/lessons?${params.toString()}`;
  }

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
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  Payment
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle" />
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 text-ink">
                    {formatFullDateTime(lesson.start_time, timeZone)}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{lesson.subject_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lesson.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {lesson.price != null
                      ? formatMoney(lesson.price, lesson.currency ?? "USD", locale)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={lesson.payment_status} />
                  </td>
                  <td className="px-4 py-3">
                    {lesson.status === "scheduled" && lesson.meeting_url && (
                      <a
                        href={lesson.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-brand hover:text-brand-strong hover:underline"
                      >
                        Join
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-brand hover:text-brand-strong hover:underline">
              &larr; Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="text-brand hover:text-brand-strong hover:underline">
              Next &rarr;
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
