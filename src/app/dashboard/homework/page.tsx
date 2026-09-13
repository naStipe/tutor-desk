import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar } from "../../../components/Avatar";
import { LinkButton } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { BookIcon } from "../../../components/icons";
import { PageHeader } from "../../../components/PageHeader";
import { HomeworkStatusBadge } from "../../../features/homework/components/HomeworkStatusBadge";
import { listHomework } from "../../../features/homework/data";
import { cached } from "../../../lib/cache";
import { getCurrentUser } from "../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00`);
  const isOverdue = date.getTime() < new Date().setHours(0, 0, 0, 0);
  const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return isOverdue ? `Overdue · ${label}` : `Due ${label}`;
}

export default async function HomeworkPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const homework = await cached(`homework-list:${user.id}`, [`homework:${user.id}`], 30_000, () =>
    listHomework(supabase),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework"
        description="Assignments, submissions, and feedback."
        actions={<LinkButton href="/dashboard/homework/new">Add homework</LinkButton>}
      />

      {homework.length === 0 ? (
        <EmptyState
          title="No homework yet"
          description="Assign your first piece of homework to a student."
          icon={<BookIcon className="h-6 w-6" />}
          action={<LinkButton href="/dashboard/homework/new">Add homework</LinkButton>}
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {homework.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/homework/${item.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-muted"
            >
              <Avatar name={item.student?.name ?? "?"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                <p className="truncate text-sm text-ink-muted">
                  {item.student?.name ?? "Unknown student"} · {formatDueDate(item.due_date)}
                </p>
              </div>
              <HomeworkStatusBadge status={item.status} />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
