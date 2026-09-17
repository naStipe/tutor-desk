"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "../../../components/Avatar";
import { Button, LinkButton } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { BookIcon } from "../../../components/icons";
import { PageHeader } from "../../../components/PageHeader";
import { Select } from "../../../components/Select";
import { HomeworkStatusBadge } from "./HomeworkStatusBadge";

export type ListHomework = {
  id: string;
  title: string;
  studentId: string;
  studentName: string;
  subjectId: string | null;
  subjectName: string | null;
  dueDate: string | null;
  status: string;
};

const selectClass =
  "flex w-auto items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-border-strong focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-brand/25";

// due_date is a calendar date with no time-of-day, so it's parsed and displayed in UTC rather
// than any particular timezone, keeping the date stable regardless of the viewer's clock.
function formatDueDate(value: string | null, locale: string) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00Z`);
  const todayUtcMidnight = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const isOverdue = date.getTime() < todayUtcMidnight.getTime();
  const label = date.toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  return isOverdue ? `Overdue · ${label}` : `Due ${label}`;
}

export function HomeworkListView({
  homework,
  students,
  subjects,
  studentFilter,
  subjectFilter,
  page,
  pageSize,
  totalCount,
  locale,
}: {
  homework: ListHomework[];
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  studentFilter: string;
  subjectFilter: string;
  page: number;
  pageSize: number;
  totalCount: number;
  locale: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "all") next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in updates)) next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework"
        description="Assignments, submissions, and feedback."
        actions={<LinkButton href="/dashboard/homework/new">Add homework</LinkButton>}
      />

      {(totalCount > 0 || studentFilter !== "all" || subjectFilter !== "all") && (
        <div className="flex flex-wrap gap-2">
          <Select
            value={studentFilter}
            onChange={(value) => pushParams({ student: value })}
            className={selectClass}
            options={[
              { value: "all", label: "All students" },
              ...students.map((student) => ({ value: student.id, label: student.name })),
            ]}
          />
          <Select
            value={subjectFilter}
            onChange={(value) => pushParams({ subject: value })}
            className={selectClass}
            options={[
              { value: "all", label: "All subjects" },
              ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
            ]}
          />
        </div>
      )}

      {totalCount === 0 ? (
        <EmptyState
          title="No homework yet"
          description="Assign your first piece of homework to a student."
          icon={<BookIcon className="h-6 w-6" />}
          action={<LinkButton href="/dashboard/homework/new">Add homework</LinkButton>}
        />
      ) : homework.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No homework matches these filters.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {homework.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/homework/${item.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-muted"
            >
              <Avatar name={item.studentName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                <p className="truncate text-sm text-ink-muted">
                  {item.studentName}
                  {item.subjectName ? ` · ${item.subjectName}` : ""} · {formatDueDate(item.dueDate, locale)}
                </p>
              </div>
              <HomeworkStatusBadge status={item.status} />
            </Link>
          ))}
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>
            Page {page} of {totalPages} · {totalCount} homework items
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => pushParams({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => pushParams({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
