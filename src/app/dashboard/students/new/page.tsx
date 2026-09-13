import { Card } from "../../../../components/Card";
import { PageHeader } from "../../../../components/PageHeader";
import { createStudentAction } from "../../../../features/students/actions";
import { StudentForm } from "../../../../features/students/components/StudentForm";

export default function NewStudentPage() {
  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Add student" description="Create a new student record." />
      <Card>
        <StudentForm
          action={createStudentAction}
          submitLabel="Add student"
          pendingLabel="Adding…"
        />
      </Card>
    </div>
  );
}
