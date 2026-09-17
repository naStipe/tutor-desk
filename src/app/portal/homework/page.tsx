import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeader } from "../../../components/PageHeader";
import { HomeworkStatusBadge } from "../../../features/homework/components/HomeworkStatusBadge";
import {
  getSignedAttachmentUrl,
  listAttachments,
  listHomeworkPage,
} from "../../../features/homework/data";
import { requirePortalStudent } from "../../../features/portal/resolve";
import { PortalSubmissionForm } from "../../../features/portal/components/PortalSubmissionForm";
import { getTutorFormatSettings } from "../../../features/tutor-profile/data";
import { getCurrentUser } from "../../../lib/supabase/current-user";

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

const PAGE_SIZE = 15;

export default async function PortalHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; page?: string }>;
}) {
  const { student: studentId, page: pageParam } = await searchParams;
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const student = await requirePortalStudent(supabase, studentId);

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [{ homework, totalCount }, { locale }] = await Promise.all([
    listHomeworkPage(supabase, { studentId: student.id, page, pageSize: PAGE_SIZE }),
    getTutorFormatSettings(supabase, student.tutor_id),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (studentId) params.set("student", studentId);
    params.set("page", String(target));
    return `/portal/homework?${params.toString()}`;
  }
  const attachmentsByHomework = new Map(
    await Promise.all(
      homework.map(async (item) => {
        const rows = await listAttachments(supabase, item.id);
        const withUrls = await Promise.all(
          rows.map(async (row) => ({
            id: row.id,
            file_name: row.file_name,
            url: await getSignedAttachmentUrl(supabase, row.storage_path).catch(() => null),
          })),
        );
        return [item.id, withUrls] as const;
      }),
    ),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Homework" description="Your assignments" />

      {homework.length === 0 ? (
        <EmptyState title="No homework yet" description="You don't have any homework assigned." />
      ) : (
        <div className="space-y-3">
          {homework.map((item) => (
            <Card key={item.id}>
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                  <p className="truncate text-sm text-ink-muted">
                    {item.subject?.name ? `${item.subject.name} · ` : ""}
                    {formatDueDate(item.due_date, locale)}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-sm text-ink-muted">{item.description}</p>
                  )}
                  {Array.isArray(item.links) && item.links.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {(item.links as { label: string | null; url: string }[]).map((link) => (
                        <li key={link.url}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-brand hover:text-brand-strong hover:underline"
                          >
                            {link.label || link.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {(attachmentsByHomework.get(item.id)?.length ?? 0) > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {attachmentsByHomework.get(item.id)!.map((attachment) =>
                        attachment.url ? (
                          <li key={attachment.id}>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-brand hover:text-brand-strong hover:underline"
                            >
                              {attachment.file_name}
                            </a>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  )}
                  {item.status === "reviewed" && item.feedback_text && (
                    <p className="mt-1 text-sm text-ink-muted">Feedback: {item.feedback_text}</p>
                  )}
                </div>
                <HomeworkStatusBadge status={item.status} />
              </div>

              {item.status !== "reviewed" && student.role === "learner" && (
                <PortalSubmissionForm
                  homeworkId={item.id}
                  defaultValue={item.submission_text ?? ""}
                  isResubmission={item.status === "submitted"}
                />
              )}
            </Card>
          ))}
        </div>
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
