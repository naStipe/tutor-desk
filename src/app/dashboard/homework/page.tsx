import Link from "next/link";
import { Avatar } from "../../../components/Avatar";
import { LinkButton } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeader } from "../../../components/PageHeader";
import { HomeworkStatusBadge } from "../../../features/homework/components/HomeworkStatusBadge";
import { listHomework } from "../../../features/homework/data";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00`);
  const isOverdue = date.getTime() < new Date().setHours(0, 0, 0, 0);
  const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return isOverdue ? `Overdue · ${label}` : `Due ${label}`;
}

export default async function HomeworkPage() {
  const supabase = await createClient();
  const homework = await listHomework(supabase);

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
          action={<LinkButton href="/dashboard/homework/new">Add homework</LinkButton>}
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {homework.map((item) => (
            <li key={item.id}>
              <Link
                href={`/dashboard/homework/${item.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
              >
                <Avatar name={item.student?.name ?? "?"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="truncate text-sm text-slate-500">
                    {item.student?.name ?? "Unknown student"} · {formatDueDate(item.due_date)}
                  </p>
                </div>
                <HomeworkStatusBadge status={item.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
