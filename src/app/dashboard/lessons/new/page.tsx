import { LinkButton } from "../../../../components/Button";
import { EmptyState } from "../../../../components/EmptyState";
import { PageHeader } from "../../../../components/PageHeader";
import { createLessonAction } from "../../../../features/lessons/actions";
import { LessonForm } from "../../../../features/lessons/components/LessonForm";
import { listActiveStudents } from "../../../../features/students/data";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewLessonPage() {
  const supabase = await createClient();
  const students = await listActiveStudents(supabase);

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Schedule lesson" description="Add a lesson to your calendar." />

      {students.length === 0 ? (
        <EmptyState
          title="Add a student first"
          description="You need at least one active student before you can schedule a lesson."
          action={<LinkButton href="/dashboard/students/new">Add student</LinkButton>}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <LessonForm
            action={createLessonAction}
            students={students}
            submitLabel="Schedule lesson"
            pendingLabel="Scheduling…"
          />
        </div>
      )}
    </div>
  );
}
