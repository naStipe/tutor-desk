"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/Card";
import { PageHeader } from "../../../components/PageHeader";
import { toDateParam } from "../date-utils";
import type { CalendarHomeworkItem, CalendarLesson } from "./LessonCalendar";
import { MonthCalendar } from "./MonthCalendar";
import { StudentLessonCalendar } from "./StudentLessonCalendar";

const navLinkClass =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted";
const toggleActiveClass = "rounded-md bg-brand px-3 py-1 text-sm font-medium text-on-brand";
const toggleInactiveClass =
  "rounded-md px-3 py-1 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted";

type View = "day" | "week" | "month";

export function StudentScheduleView({
  studentName,
  description,
  prevHref,
  todayHref,
  nextHref,
  dayHref,
  weekHref,
  monthHref,
  monthBaseHref,
  dayBaseHref,
  view,
  dayStartValues,
  lessons,
  showHomework,
  monthCountByDate,
  monthAnchorValue,
  homeworkCountByDate,
  homeworkItems,
}: {
  studentName: string;
  description: string;
  prevHref: string;
  todayHref: string;
  nextHref: string;
  dayHref: string;
  weekHref: string;
  monthHref: string;
  /** `/dashboard/student-view/schedule?view=month&student=<id>` — date gets appended on select. */
  monthBaseHref: string;
  /** `/dashboard/student-view/schedule?view=day&student=<id>` — date gets appended on select. */
  dayBaseHref: string;
  view: View;
  dayStartValues: string[];
  lessons: CalendarLesson[];
  showHomework: boolean;
  monthCountByDate: Record<string, number>;
  monthAnchorValue: string;
  homeworkCountByDate: Record<string, number>;
  homeworkItems: CalendarHomeworkItem[];
}) {
  const router = useRouter();

  function toggleHomework(checked: boolean) {
    const url = new URL(window.location.href);
    if (checked) {
      url.searchParams.set("homework", "1");
    } else {
      url.searchParams.delete("homework");
    }
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" description={`${description} · ${studentName}`} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {view === "month" ? (
          <Link href={todayHref} className={navLinkClass}>
            Today
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link href={prevHref} className={navLinkClass}>
              &larr; Prev
            </Link>
            <Link href={todayHref} className={navLinkClass}>
              Today
            </Link>
            <Link href={nextHref} className={navLinkClass}>
              Next &rarr;
            </Link>
          </div>
        )}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <Link href={dayHref} className={view === "day" ? toggleActiveClass : toggleInactiveClass}>
            Day
          </Link>
          <Link
            href={weekHref}
            className={view === "week" ? toggleActiveClass : toggleInactiveClass}
          >
            Week
          </Link>
          <Link
            href={monthHref}
            className={view === "month" ? toggleActiveClass : toggleInactiveClass}
          >
            Month
          </Link>
        </div>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={showHomework}
          onChange={(event) => toggleHomework(event.target.checked)}
          className="h-4 w-4 rounded border-border text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        Show homework due dates
      </label>

      {view === "month" ? (
        <Card>
          <MonthCalendar
            month={new Date(monthAnchorValue)}
            onMonthChange={(month) =>
              router.push(`${monthBaseHref}&date=${toDateParam(month)}`)
            }
            selectedDate={null}
            onSelectDate={(dateParam) => router.push(`${dayBaseHref}&date=${dateParam}`)}
            countByDate={monthCountByDate}
            homeworkCountByDate={showHomework ? homeworkCountByDate : undefined}
          />
        </Card>
      ) : (
        <StudentLessonCalendar
          dayStartValues={dayStartValues}
          lessons={lessons}
          homeworkItems={showHomework ? homeworkItems : []}
        />
      )}
    </div>
  );
}
