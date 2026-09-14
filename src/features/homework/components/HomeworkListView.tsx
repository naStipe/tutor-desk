"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "../../../components/Avatar";
import { LinkButton } from "../../../components/Button";
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

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00`);
  const isOverdue = date.getTime() < new Date().setHours(0, 0, 0, 0);
  const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return isOverdue ? `Overdue · ${label}` : `Due ${label}`;
}

export function HomeworkListView({
  homework,
  students,
  subjects,
}: {
  homework: ListHomework[];
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}) {
  const [studentFilter, setStudentFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const filtered = useMemo(() => {
    return homework.filter((item) => {
      if (studentFilter !== "all" && item.studentId !== studentFilter) return false;
      if (subjectFilter !== "all" && item.subjectId !== subjectFilter) return false;
      return true;
    });
  }, [homework, studentFilter, subjectFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework"
        description="Assignments, submissions, and feedback."
        actions={<LinkButton href="/dashboard/homework/new">Add homework</LinkButton>}
      />

      {homework.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
      )}

      {homework.length === 0 ? (
        <EmptyState
          title="No homework yet"
          description="Assign your first piece of homework to a student."
          icon={<BookIcon className="h-6 w-6" />}
          action={<LinkButton href="/dashboard/homework/new">Add homework</LinkButton>}
        />
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No homework matches these filters.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {filtered.map((item) => (
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
                  {item.subjectName ? ` · ${item.subjectName}` : ""} · {formatDueDate(item.dueDate)}
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
