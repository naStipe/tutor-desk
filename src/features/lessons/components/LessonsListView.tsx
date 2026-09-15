"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, LinkButton } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { PageHeader } from "../../../components/PageHeader";
import { Select } from "../../../components/Select";
import { formatFullDateTime } from "../date-utils";
import type { LessonListSortKey } from "../data";
import type { LessonStatus } from "../schemas";
import { PaymentBadge } from "./PaymentBadge";
import { StatusBadge } from "./StatusBadge";

export type ListLesson = {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string | null;
  subjectName: string | null;
  startTime: string;
  status: LessonStatus;
  paymentStatus: string;
  price: number | null;
  currency: string | null;
};

const STATUS_FILTERS: { value: LessonStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-show" },
];

const selectClass =
  "flex w-auto items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-border-strong focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-brand/25";

export function LessonsListView({
  lessons,
  students,
  subjects,
  hasStudents,
  statusFilter,
  studentFilter,
  subjectFilter,
  sortKey,
  sortDir,
  page,
  pageSize,
  totalCount,
}: {
  lessons: ListLesson[];
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  hasStudents: boolean;
  statusFilter: LessonStatus | "all";
  studentFilter: string;
  subjectFilter: string;
  sortKey: LessonListSortKey;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
  totalCount: number;
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

  function toggleSort(key: LessonListSortKey) {
    if (key === sortKey) {
      pushParams({ dir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sort: key, dir: key === "date" ? "desc" : "asc" });
    }
  }

  const sortHeaderClass = (key: LessonListSortKey) =>
    `flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide transition-colors ${
      sortKey === key ? "text-ink" : "text-ink-subtle hover:text-ink"
    }`;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lessons"
        description="Every lesson, filterable and sortable."
        actions={
          hasStudents ? (
            <LinkButton href="/dashboard/schedule?create=1">Schedule lesson</LinkButton>
          ) : (
            <LinkButton href="/dashboard/students/new">Add student first</LinkButton>
          )
        }
      />

      <div className="flex flex-wrap gap-2">
        <Select
          value={statusFilter}
          onChange={(value) => pushParams({ status: value })}
          className={selectClass}
          options={STATUS_FILTERS}
        />
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

      {lessons.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No lessons match these filters.</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("date")}
                      className={sortHeaderClass("date")}
                    >
                      Date {sortKey === "date" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("student")}
                      className={sortHeaderClass("student")}
                    >
                      Student {sortKey === "student" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("subject")}
                      className={sortHeaderClass("subject")}
                    >
                      Subject {sortKey === "subject" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("status")}
                      className={sortHeaderClass("status")}
                    >
                      Status {sortKey === "status" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson, index) => (
                  <tr
                    key={lesson.id}
                    className="animate-td-row-in border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted"
                    style={{ animationDelay: `${Math.min(index, 20) * 15}ms` }}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/lessons/${lesson.id}`}
                        className="text-ink hover:underline"
                      >
                        {formatFullDateTime(lesson.startTime)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{lesson.studentName}</td>
                    <td className="px-4 py-3 text-ink-muted">{lesson.subjectName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lesson.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={lesson.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>
                Page {page} of {totalPages} · {totalCount} lessons
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
        </>
      )}
    </div>
  );
}
