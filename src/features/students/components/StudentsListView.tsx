"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "../../../components/Avatar";
import { LinkButton } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { inputClassName } from "../../../components/Field";
import { UsersIcon } from "../../../components/icons";
import { PageHeader } from "../../../components/PageHeader";

export type ListStudent = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  telegram: string | null;
};

const SEARCH_DEBOUNCE_MS = 300;

export function StudentsListView({
  students,
  highlight,
  query,
}: {
  students: ListStudent[];
  highlight?: string;
  query: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync when the URL changes from outside this component (back/forward nav).
  useEffect(() => {
    setSearch(query);
  }, [query]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      router.replace(`${pathname}?${next.toString()}`);
    }, SEARCH_DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="The people you're tutoring."
        actions={
          <>
            <Link
              href="/dashboard/students/archived"
              className="text-sm text-ink-muted hover:text-ink"
            >
              Archived students
            </Link>
            <LinkButton href="/dashboard/students/new">Add student</LinkButton>
          </>
        }
      />

      {(students.length > 0 || hasQuery) && (
        <input
          type="text"
          value={search}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search students by name…"
          aria-label="Search students by name"
          className={`max-w-sm ${inputClassName}`}
        />
      )}

      {students.length === 0 && !hasQuery ? (
        <EmptyState
          title="No students yet"
          description="Add your first student to start organizing lessons and homework."
          icon={<UsersIcon className="h-6 w-6" />}
          action={<LinkButton href="/dashboard/students/new">Add student</LinkButton>}
        />
      ) : students.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No students match "{query}".</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/dashboard/students/${student.id}`}
              className={`flex items-center gap-4 px-5 py-4 transition-[background-color,transform] duration-100 hover:bg-surface-muted active:scale-[0.99] active:bg-surface-muted motion-reduce:active:scale-100 ${
                student.id === highlight ? "ring-2 ring-inset ring-brand bg-brand/5" : ""
              }`}
            >
              <Avatar name={student.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{student.name}</p>
                {(student.email ?? student.phone ?? student.telegram) && (
                  <p className="truncate text-sm text-ink-muted">
                    {student.email ?? student.phone ?? student.telegram}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-ink-subtle" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
