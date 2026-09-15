import Link from "next/link";
import { Card } from "../../../components/Card";
import { HomeworkStatusBadge } from "../../homework/components/HomeworkStatusBadge";
import { formatAgendaDateTime } from "../date-utils";
import type { LessonStatus } from "../schemas";
import { PaymentBadge } from "./PaymentBadge";
import { StatusBadge } from "./StatusBadge";

export type AgendaLesson = {
  id: string;
  studentName: string;
  subjectName: string | null;
  startTime: string;
  status: LessonStatus;
  paymentStatus: string;
};

export type AgendaHomework = {
  id: string;
  title: string;
  studentName: string;
  subjectName: string | null;
  status: string;
  dateLabel: string;
};

/** Compact list of the lessons and homework in the current schedule range, for quick review and editing. */
export function ScheduleAgenda({
  lessons,
  homework,
  timeZone,
  singleColumn,
}: {
  lessons: AgendaLesson[];
  homework: AgendaHomework[];
  timeZone?: string;
  /** Stack the two lists instead of placing them side by side, for narrow layouts like the day-view sidebar. */
  singleColumn?: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 gap-6 ${singleColumn ? "" : "lg:grid-cols-2"}`}>
      <Card className="p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">Lessons</h3>
        </div>
        {lessons.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink-subtle">No lessons in this range.</p>
        ) : (
          <ul className="divide-y divide-border">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/dashboard/lessons/${lesson.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{lesson.studentName}</p>
                    <p className="truncate text-xs text-ink-subtle">
                      {formatAgendaDateTime(lesson.startTime, timeZone)}
                      {lesson.subjectName ? ` · ${lesson.subjectName}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={lesson.status} />
                    <PaymentBadge status={lesson.paymentStatus} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">Homework</h3>
        </div>
        {homework.length === 0 ? (
          <p className="px-4 py-4 text-sm text-ink-subtle">No homework in this range.</p>
        ) : (
          <ul className="divide-y divide-border">
            {homework.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/dashboard/homework/${item.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                    <p className="truncate text-xs text-ink-subtle">
                      {item.studentName}
                      {item.subjectName ? ` · ${item.subjectName}` : ""} · {item.dateLabel}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <HomeworkStatusBadge status={item.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
