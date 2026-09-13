import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "../../../../components/Avatar";
import { Button } from "../../../../components/Button";
import { Card } from "../../../../components/Card";
import { PageHeader } from "../../../../components/PageHeader";
import {
  archiveStudentAction,
  deleteStudentAction,
  updateStudentAction,
} from "../../../../features/students/actions";
import { ConfirmDeleteForm } from "../../../../features/students/components/ConfirmDeleteForm";
import { StudentForm } from "../../../../features/students/components/StudentForm";
import { getStudent } from "../../../../features/students/data";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  // Fixed locale keeps this readable regardless of the server's OS locale.
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const supabase = await createClient();
  const student = await getStudent(supabase, id);
  if (!student) notFound();

  const isArchived = student.archived_at !== null;

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title={student.name}
        description={
          isArchived
            ? `Archived ${formatDate(student.archived_at as string)}`
            : `Added ${formatDate(student.created_at)}`
        }
        avatar={<Avatar name={student.name} />}
        actions={
          <Link href="/dashboard/students" className="text-sm text-ink-muted hover:text-ink">
            &larr; Back to students
          </Link>
        }
      />

      <Card>
        <h2 className="text-sm font-semibold text-ink">Edit details</h2>
        <div className="mt-4">
          <StudentForm
            action={updateStudentAction}
            studentId={student.id}
            defaultValues={{
              name: student.name,
              email: student.email ?? "",
              phone: student.phone ?? "",
              telegram: student.telegram ?? "",
              notes: student.notes ?? "",
            }}
            submitLabel="Save changes"
            pendingLabel="Saving…"
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Danger zone</h2>

        {!isArchived && (
          <div>
            <p className="text-sm text-ink-muted">
              Archived students are hidden from your active roster and their scheduled lessons are
              cancelled. This does not delete their data.
            </p>
            <form action={archiveStudentAction} className="mt-3">
              <input type="hidden" name="id" value={student.id} />
              <Button type="submit" variant="danger">
                Archive student
              </Button>
            </form>
          </div>
        )}

        <div>
          <p className="text-sm text-ink-muted">
            Permanently deleting a student removes their record and cancels their scheduled lessons.
            This cannot be undone.
          </p>
          <ConfirmDeleteForm
            action={deleteStudentAction}
            id={student.id}
            from="/dashboard/students"
            label="Delete permanently"
            confirmMessage={`Permanently delete ${student.name}? This cannot be undone.`}
            className="mt-3"
          />
        </div>
      </Card>
    </div>
  );
}
