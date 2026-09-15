"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LinkButton } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { PageHeader } from "../../../components/PageHeader";
import { Select } from "../../../components/Select";
import { formatFullDateTime } from "../date-utils";
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

type SortKey = "date" | "student" | "subject" | "status";

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
}: {
  lessons: ListLesson[];
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  hasStudents: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<LessonStatus | "all">("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    return lessons.filter((lesson) => {
      if (statusFilter !== "all" && lesson.status !== statusFilter) return false;
      if (studentFilter !== "all" && lesson.studentId !== studentFilter) return false;
      if (subjectFilter !== "all" && lesson.subjectId !== subjectFilter) return false;
      return true;
    });
  }, [lessons, statusFilter, studentFilter, subjectFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "student":
          return a.studentName.localeCompare(b.studentName) * dir;
        case "subject":
          return (a.subjectName ?? "").localeCompare(b.subjectName ?? "") * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        default:
          return (new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) * dir;
      }
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  }

  const sortHeaderClass = (key: SortKey) =>
    `flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide transition-colors ${
      sortKey === key ? "text-ink" : "text-ink-subtle hover:text-ink"
    }`;

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
          onChange={(value) => setStatusFilter(value as LessonStatus | "all")}
          className={selectClass}
          options={STATUS_FILTERS}
        />
        <Select
          value={studentFilter}
          onChange={setStudentFilter}
          className={selectClass}
          options={[
            { value: "all", label: "All students" },
            ...students.map((student) => ({ value: student.id, label: student.name })),
          ]}
        />
        <Select
          value={subjectFilter}
          onChange={setSubjectFilter}
          className={selectClass}
          options={[
            { value: "all", label: "All subjects" },
            ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
          ]}
        />
      </div>

      {sorted.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No lessons match these filters.</p>
        </Card>
      ) : (
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
              {sorted.map((lesson, index) => (
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
      )}
    </div>
  );
}
