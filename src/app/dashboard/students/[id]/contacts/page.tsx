import { notFound } from "next/navigation";
import { Card } from "../../../../../components/Card";
import { updateStudentAction } from "../../../../../features/students/actions";
import { StudentForm } from "../../../../../features/students/components/StudentForm";
import { getStudent } from "../../../../../features/students/data";
import { createClient } from "../../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentContactsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const student = await getStudent(supabase, id);
  if (!student) notFound();

  return (
    <Card>
      <StudentForm
        action={updateStudentAction}
        studentId={student.id}
        section="contact"
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
    </Card>
  );
}
