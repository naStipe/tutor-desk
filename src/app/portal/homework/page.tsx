import { redirect } from "next/navigation";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeader } from "../../../components/PageHeader";
import { HomeworkStatusBadge } from "../../../features/homework/components/HomeworkStatusBadge";
import {
  getSignedAttachmentUrl,
  listAttachments,
  listHomework,
} from "../../../features/homework/data";
import { requirePortalStudent } from "../../../features/portal/resolve";
import { PortalSubmissionForm } from "../../../features/portal/components/PortalSubmissionForm";
import { getCurrentUser } from "../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00`);
  const isOverdue = date.getTime() < new Date().setHours(0, 0, 0, 0);
  const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return isOverdue ? `Overdue · ${label}` : `Due ${label}`;
}

export default async function PortalHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student: studentId } = await searchParams;
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const student = await requirePortalStudent(supabase, studentId);

  const homework = await listHomework(supabase, { studentId: student.id, limit: 100 });
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
                    {formatDueDate(item.due_date)}
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
    </div>
  );
}
