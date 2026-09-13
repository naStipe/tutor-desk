import { LinkButton } from "../../../../components/Button";
import { Card } from "../../../../components/Card";
import { EmptyState } from "../../../../components/EmptyState";
import { PageHeader } from "../../../../components/PageHeader";
import { createHomeworkAction } from "../../../../features/homework/actions";
import { HomeworkForm } from "../../../../features/homework/components/HomeworkForm";
import { listLessonsForSelect } from "../../../../features/lessons/data";
import { formatTimeRange } from "../../../../features/lessons/date-utils";
import { listActiveStudents } from "../../../../features/students/data";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewHomeworkPage() {
  const supabase = await createClient();
  const [students, lessons] = await Promise.all([
    listActiveStudents(supabase),
    listLessonsForSelect(supabase),
  ]);

  const lessonOptions = lessons.map((lesson) => ({
    id: lesson.id,
    label: `${lesson.student?.name ?? "Unknown"} — ${new Date(lesson.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${formatTimeRange(lesson.start_time, lesson.end_time)}`,
  }));

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Add homework" description="Assign homework to a student." />

      {students.length === 0 ? (
        <EmptyState
          title="Add a student first"
          description="You need at least one active student before you can assign homework."
          action={<LinkButton href="/dashboard/students/new">Add student</LinkButton>}
        />
      ) : (
        <Card>
          <HomeworkForm
            action={createHomeworkAction}
            students={students}
            lessons={lessonOptions}
            submitLabel="Add homework"
            pendingLabel="Adding…"
          />
        </Card>
      )}
    </div>
  );
}
