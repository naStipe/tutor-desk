import Link from "next/link";
import { LinkButton } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeader } from "../../../components/PageHeader";
import { listActiveStudents } from "../../../features/students/data";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const supabase = await createClient();
  const students = await listActiveStudents(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="The people you're tutoring."
        actions={<LinkButton href="/dashboard/students/new">Add student</LinkButton>}
      />

      {students.length === 0 ? (
        <EmptyState
          title="No students yet"
          description="Add your first student to start organizing lessons and homework."
          action={<LinkButton href="/dashboard/students/new">Add student</LinkButton>}
        />
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {students.map((student) => (
            <li key={student.id}>
              <Link
                href={`/dashboard/students/${student.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{student.name}</p>
                  {student.email && (
                    <p className="truncate text-sm text-slate-500">{student.email}</p>
                  )}
                </div>
                <span className="shrink-0 text-slate-300" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
