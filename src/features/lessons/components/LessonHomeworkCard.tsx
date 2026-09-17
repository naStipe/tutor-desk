import Link from "next/link";
import { LinkButton } from "../../../components/Button";
import { HomeworkStatusBadge } from "../../homework/components/HomeworkStatusBadge";
import type { HomeworkWithStudent } from "../../homework/data";

// due_date is a calendar date with no time-of-day, so it's parsed and displayed in UTC rather
// than any particular timezone, keeping the date stable regardless of the viewer's clock.
function formatDueDate(value: string | null, locale: string) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00Z`);
  return `Due ${date.toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: "UTC" })}`;
}

export function LessonHomeworkCard({
  lessonId,
  studentId,
  homework,
  locale,
}: {
  lessonId: string;
  studentId: string;
  homework: HomeworkWithStudent[];
  locale: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Homework</h2>
        <LinkButton
          variant="secondary"
          href={`/dashboard/homework/new?studentId=${studentId}&lessonId=${lessonId}`}
        >
          Add homework
        </LinkButton>
      </div>
      {homework.length === 0 ? (
        <p className="text-sm text-ink-subtle">No homework linked to this lesson.</p>
      ) : (
        <ul className="divide-y divide-border">
          {homework.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <Link
                href={`/dashboard/homework/${item.id}`}
                className="min-w-0 flex-1 truncate text-sm font-medium text-ink hover:text-brand"
              >
                {item.title}
              </Link>
              <span className="shrink-0 text-xs text-ink-subtle">
                {formatDueDate(item.due_date, locale)}
              </span>
              <HomeworkStatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
