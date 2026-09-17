import { notFound } from "next/navigation";
import { Card } from "../../../../components/Card";
import { ConfirmSubmitForm } from "../../../../components/ConfirmSubmitForm";
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

export default async function StudentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const student = await getStudent(supabase, id);
  if (!student) notFound();

  const isArchived = student.archived_at !== null;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-sm font-semibold text-ink">Edit details</h2>
        <div className="mt-4">
          <StudentForm
            action={updateStudentAction}
            studentId={student.id}
            section="identity"
            defaultValues={{
              name: student.name,
              email: student.email ?? "",
              phone: student.phone ?? "",
              telegram: student.telegram ?? "",
              guardianName: student.guardian_name ?? "",
              guardianEmail: student.guardian_email ?? "",
              guardianPhone: student.guardian_phone ?? "",
              guardianTelegram: student.guardian_telegram ?? "",
              notes: student.notes ?? "",
              defaultHourlyRate: student.default_hourly_rate?.toString() ?? "",
              defaultCurrency: student.default_currency ?? "RUB",
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
            <ConfirmSubmitForm
              action={archiveStudentAction}
              confirmMessage={`Archive ${student.name}? This immediately cancels all of their scheduled lessons.`}
              label="Archive student"
              className="mt-3"
            >
              <input type="hidden" name="id" value={student.id} />
            </ConfirmSubmitForm>
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
