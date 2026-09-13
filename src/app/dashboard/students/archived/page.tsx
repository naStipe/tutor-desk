import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar } from "../../../../components/Avatar";
import { Card } from "../../../../components/Card";
import { EmptyState } from "../../../../components/EmptyState";
import { UsersIcon } from "../../../../components/icons";
import { PageHeader } from "../../../../components/PageHeader";
import { deleteStudentAction } from "../../../../features/students/actions";
import { ConfirmDeleteForm } from "../../../../features/students/components/ConfirmDeleteForm";
import { listArchivedStudents } from "../../../../features/students/data";
import { cached } from "../../../../lib/cache";
import { getCurrentUser } from "../../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

export default async function ArchivedStudentsPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const students = await cached(
    `students-archived:${user.id}`,
    [`students:${user.id}`],
    30_000,
    () => listArchivedStudents(supabase),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Archived students"
        description="Students hidden from your active roster."
        actions={
          <Link href="/dashboard/students" className="text-sm text-ink-muted hover:text-ink">
            &larr; Back to students
          </Link>
        }
      />

      {students.length === 0 ? (
        <EmptyState
          title="No archived students"
          description="Students you archive will show up here, where you can permanently delete them."
          icon={<UsersIcon className="h-6 w-6" />}
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {students.map((student) => (
            <div key={student.id} className="flex items-center gap-4 px-5 py-4">
              <Avatar name={student.name} />
              <Link
                href={`/dashboard/students/${student.id}`}
                className="min-w-0 flex-1 hover:underline"
              >
                <p className="truncate text-sm font-medium text-ink">{student.name}</p>
                {(student.email ?? student.phone ?? student.telegram) && (
                  <p className="truncate text-sm text-ink-muted">
                    {student.email ?? student.phone ?? student.telegram}
                  </p>
                )}
              </Link>
              <ConfirmDeleteForm
                action={deleteStudentAction}
                id={student.id}
                from="/dashboard/students/archived"
                label="Delete permanently"
                confirmMessage={`Permanently delete ${student.name}? This cannot be undone.`}
                className="shrink-0"
              />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
