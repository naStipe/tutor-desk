import { PageHeader } from "../../../../components/PageHeader";
import { createStudentAction } from "../../../../features/students/actions";
import { StudentForm } from "../../../../features/students/components/StudentForm";

export default function NewStudentPage() {
  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Add student" description="Create a new student record." />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <StudentForm
          action={createStudentAction}
          submitLabel="Add student"
          pendingLabel="Adding…"
        />
      </div>
    </div>
  );
}
