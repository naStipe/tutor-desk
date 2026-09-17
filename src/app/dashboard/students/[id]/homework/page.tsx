import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "../../../../../components/Card";
import { EmptyState } from "../../../../../components/EmptyState";
import { LinkButton } from "../../../../../components/Button";
import { BookIcon } from "../../../../../components/icons";
import { HomeworkStatusBadge } from "../../../../../features/homework/components/HomeworkStatusBadge";
import { listHomework } from "../../../../../features/homework/data";
import { getStudent } from "../../../../../features/students/data";
import { getTutorFormatSettings } from "../../../../../features/tutor-profile/data";
import { createClient } from "../../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDueDate(value: string | null, locale: string) {
  if (!value) return "No due date";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function StudentHomeworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const student = await getStudent(supabase, id);
  if (!student) notFound();

  const [homework, { locale }] = await Promise.all([
    listHomework(supabase, { studentId: id }),
    getTutorFormatSettings(supabase, student.tutor_id),
  ]);

  if (homework.length === 0) {
    return (
      <EmptyState
        title="No homework yet"
        description={`Assign the first piece of homework to ${student.name}.`}
        icon={<BookIcon className="h-6 w-6" />}
        action={
          <LinkButton href={`/dashboard/homework/new?studentId=${id}`}>Add homework</LinkButton>
        }
      />
    );
  }

  return (
    <Card className="divide-y divide-border p-0">
      {homework.map((item) => (
        <Link
          key={item.id}
          href={`/dashboard/homework/${item.id}`}
          className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 transition-colors hover:bg-surface-muted"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{item.title}</p>
            <p className="truncate text-sm text-ink-muted">
              {item.subject?.name ? `${item.subject.name} · ` : ""}
              {formatDueDate(item.due_date, locale)}
            </p>
          </div>
          <HomeworkStatusBadge status={item.status} />
        </Link>
      ))}
    </Card>
  );
}
