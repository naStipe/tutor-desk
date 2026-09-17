import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "../../../../../components/Card";
import { EmptyState } from "../../../../../components/EmptyState";
import { CalendarIcon } from "../../../../../components/icons";
import { LinkButton } from "../../../../../components/Button";
import { formatFullDateTime } from "../../../../../features/lessons/date-utils";
import { listLessonsForStudent } from "../../../../../features/lessons/data";
import { PaymentBadge } from "../../../../../features/lessons/components/PaymentBadge";
import { StatusBadge } from "../../../../../features/lessons/components/StatusBadge";
import { getStudent } from "../../../../../features/students/data";
import { getTutorFormatSettings } from "../../../../../features/tutor-profile/data";
import { createClient } from "../../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const student = await getStudent(supabase, id);
  if (!student) notFound();

  const [lessons, { timeZone, locale }] = await Promise.all([
    listLessonsForStudent(supabase, id),
    getTutorFormatSettings(supabase, student.tutor_id),
  ]);

  if (lessons.length === 0) {
    return (
      <EmptyState
        title="No lessons yet"
        description={`Schedule the first lesson with ${student.name}.`}
        icon={<CalendarIcon className="h-6 w-6" />}
        action={<LinkButton href="/dashboard/schedule?create=1">Schedule lesson</LinkButton>}
      />
    );
  }

  return (
    <Card className="divide-y divide-border p-0">
      {lessons.map((lesson) => (
        <Link
          key={lesson.id}
          href={`/dashboard/lessons/${lesson.id}`}
          className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 transition-[background-color,transform] duration-100 hover:bg-surface-muted active:scale-[0.99] active:bg-surface-muted motion-reduce:active:scale-100"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {formatFullDateTime(lesson.start_time, timeZone, locale)}
            </p>
            <p className="truncate text-sm text-ink-muted">{lesson.subject?.name ?? "No subject"}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={lesson.status} />
            <PaymentBadge status={lesson.payment_status} />
          </div>
        </Link>
      ))}
    </Card>
  );
}
