import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar } from "../../../components/Avatar";
import { LinkButton } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { UsersIcon } from "../../../components/icons";
import { PageHeader } from "../../../components/PageHeader";
import { listActiveStudents } from "../../../features/students/data";
import { cached } from "../../../lib/cache";
import { getCurrentUser } from "../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const students = await cached(`students-active:${user.id}`, [`students:${user.id}`], 30_000, () =>
    listActiveStudents(supabase),
  );

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

      {students.length === 0 ? (
        <EmptyState
          title="No students yet"
          description="Add your first student to start organizing lessons and homework."
          icon={<UsersIcon className="h-6 w-6" />}
          action={<LinkButton href="/dashboard/students/new">Add student</LinkButton>}
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/dashboard/students/${student.id}`}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-muted"
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
