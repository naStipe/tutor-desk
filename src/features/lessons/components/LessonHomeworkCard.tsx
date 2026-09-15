import Link from "next/link";
import { LinkButton } from "../../../components/Button";
import { HomeworkStatusBadge } from "../../homework/components/HomeworkStatusBadge";
import type { HomeworkWithStudent } from "../../homework/data";

function formatDueDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00`);
  return `Due ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function LessonHomeworkCard({
  lessonId,
  studentId,
  homework,
}: {
  lessonId: string;
  studentId: string;
  homework: HomeworkWithStudent[];
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
                {formatDueDate(item.due_date)}
              </span>
              <HomeworkStatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
