import Link from "next/link";
import { Card } from "../../../components/Card";
import { formatDueSoon, formatOverdue } from "../../../lib/formatting";

export type PortalHomeworkDueItem = {
  id: string;
  title: string;
  reason: "overdue" | "due-soon";
  dueDate: string | null;
};

/**
 * A compact nudge banner for the signed-in student's own homework due soon or already overdue,
 * following the portal's existing `Card` convention (same primitive `NextLessonCard` uses).
 * Every item here is the student's own — the caller passes rows already scoped to their
 * `portal_membership` student id (see `listPortalHomeworkDueSoon`).
 */
export function HomeworkDueBanner({ items, now }: { items: PortalHomeworkDueItem[]; now: Date }) {
  if (items.length === 0) return null;
  const overdueCount = items.filter((item) => item.reason === "overdue").length;

  return (
    <Card className="space-y-3 border-danger/40">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">
          {overdueCount > 0 ? "Homework needs attention" : "Homework due soon"}
        </h2>
        <Link
          href="/portal/homework"
          className="text-xs text-brand hover:text-brand-strong hover:underline"
        >
          View all &rarr;
        </Link>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href="/portal/homework"
              className="flex items-center justify-between gap-3 text-sm text-ink hover:text-brand"
            >
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              <span
                suppressHydrationWarning
                className={`shrink-0 text-xs ${item.reason === "overdue" ? "text-danger" : "text-ink-subtle"}`}
              >
                {item.reason === "overdue"
                  ? formatOverdue(now, item.dueDate ?? now.toISOString())
                  : formatDueSoon(now, item.dueDate ?? now.toISOString())}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
