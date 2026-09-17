import { redirect } from "next/navigation";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeader } from "../../../components/PageHeader";
import { HomeworkStatusBadge } from "../../../features/homework/components/HomeworkStatusBadge";
import { listHomework } from "../../../features/homework/data";
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

export default async function PortalHomeworkPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const student = await requirePortalStudent(supabase);

  const homework = await listHomework(supabase, { studentId: student.id });

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
                  {item.status === "reviewed" && item.feedback_text && (
                    <p className="mt-1 text-sm text-ink-muted">Feedback: {item.feedback_text}</p>
                  )}
                </div>
                <HomeworkStatusBadge status={item.status} />
              </div>

              {item.status === "assigned" && <PortalSubmissionForm homeworkId={item.id} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
