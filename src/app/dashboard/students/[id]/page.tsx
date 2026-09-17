import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "../../../../components/Avatar";
import { Button } from "../../../../components/Button";
import { Card } from "../../../../components/Card";
import { PageHeader } from "../../../../components/PageHeader";
import { deleteRateAction, upsertRateAction } from "../../../../features/rates/actions";
import { RateForm } from "../../../../features/rates/components/RateForm";
import { listRatesForStudent } from "../../../../features/rates/data";
import {
  archiveStudentAction,
  deleteStudentAction,
  updateStudentAction,
} from "../../../../features/students/actions";
import { ConfirmDeleteForm } from "../../../../features/students/components/ConfirmDeleteForm";
import { InviteCard } from "../../../../features/students/components/InviteCard";
import { StudentForm } from "../../../../features/students/components/StudentForm";
import { getStudent, listPortalMembers } from "../../../../features/students/data";
import { listSubjects } from "../../../../features/subjects/data";
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

  const [rates, subjects, portalAccess] = await Promise.all([
    listRatesForStudent(supabase, id),
    listSubjects(supabase),
    listPortalMembers(supabase, id),
  ]);
  const ratedSubjectIds = new Set(rates.map((rate) => rate.subject_id));
  const availableSubjects = subjects.filter((subject) => !ratedSubjectIds.has(subject.id));

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
              defaultHourlyRate: student.default_hourly_rate?.toString() ?? "",
              defaultCurrency: student.default_currency ?? "RUB",
            }}
            submitLabel="Save changes"
            pendingLabel="Saving…"
          />
        </div>
      </Card>

      <InviteCard
        studentId={student.id}
        members={portalAccess.members}
        pendingInvites={portalAccess.pendingInvites}
      />

      <Card className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Subjects &amp; rates</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Per-subject overrides. When a lesson's subject has no override here, its default price
            above is used instead.
          </p>
        </div>

        {rates.length > 0 && (
          <div className="space-y-3">
            {rates.map((rate) => (
              <div key={rate.id} className="flex items-center gap-2">
                <span className="w-32 shrink-0 truncate text-sm text-ink">
                  {rate.subject?.name ?? "Unknown subject"}
                </span>
                <RateForm
                  action={upsertRateAction}
                  studentId={student.id}
                  fixedSubjectId={rate.subject_id}
                  defaultValues={{
                    hourlyRate: String(rate.hourly_rate),
                    currency: rate.currency,
                  }}
                  submitLabel="Save"
                  pendingLabel="Saving…"
                />
                <form action={deleteRateAction}>
                  <input type="hidden" name="id" value={rate.id} />
                  <input type="hidden" name="studentId" value={student.id} />
                  <button type="submit" className="text-sm text-ink-muted hover:text-danger">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {subjects.length === 0 ? (
          <p className="text-sm text-ink-subtle">
            <Link href="/dashboard/subjects" className="text-brand hover:underline">
              Add a subject
            </Link>{" "}
            before setting a rate.
          </p>
        ) : availableSubjects.length > 0 ? (
          <RateForm
            action={upsertRateAction}
            studentId={student.id}
            subjectOptions={availableSubjects.map((subject) => ({
              id: subject.id,
              name: subject.name,
            }))}
            submitLabel="Add rate"
            pendingLabel="Adding…"
          />
        ) : null}
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
