import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "../../../../components/Avatar";
import { Button } from "../../../../components/Button";
import { Card } from "../../../../components/Card";
import { PageHeader } from "../../../../components/PageHeader";
import { archiveStudentAction, updateStudentAction } from "../../../../features/students/actions";
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

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title={student.name}
        description={`Added ${formatDate(student.created_at)}`}
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
              notes: student.notes ?? "",
            }}
            submitLabel="Save changes"
            pendingLabel="Saving…"
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Archive student</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Archived students are hidden from your active roster. This does not delete their data.
        </p>
        <form action={archiveStudentAction} className="mt-4">
          <input type="hidden" name="id" value={student.id} />
          <Button type="submit" variant="danger">
            Archive student
          </Button>
        </form>
      </Card>
    </div>
  );
}
