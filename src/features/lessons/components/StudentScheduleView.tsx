"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "../../../components/Card";
import { PageHeader } from "../../../components/PageHeader";
import { toDateParam } from "../date-utils";
import { CalendarLegend } from "./CalendarLegend";
import type { CalendarLesson } from "./LessonCalendar";
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
  monthCountByDate,
  monthAnchorValue,
  homeworkDueCountByDate,
  homeworkReviewCountByDate,
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
  monthCountByDate: Record<string, number>;
  monthAnchorValue: string;
  homeworkDueCountByDate: Record<string, number>;
  homeworkReviewCountByDate: Record<string, number>;
}) {
  const router = useRouter();

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

      <CalendarLegend reviewLabel="Awaiting feedback" />

      {view === "month" ? (
        <Card>
          <MonthCalendar
            month={new Date(monthAnchorValue)}
            onMonthChange={(month) => router.push(`${monthBaseHref}&date=${toDateParam(month)}`)}
            selectedDate={null}
            onSelectDate={(dateParam) => router.push(`${dayBaseHref}&date=${dateParam}`)}
            countByDate={monthCountByDate}
            homeworkCountByDate={homeworkDueCountByDate}
            reviewCountByDate={homeworkReviewCountByDate}
            reviewLabel="awaiting feedback"
          />
        </Card>
      ) : (
        <StudentLessonCalendar
          dayStartValues={dayStartValues}
          lessons={lessons}
          homeworkDueCountByDate={homeworkDueCountByDate}
          homeworkAwaitingFeedbackCountByDate={homeworkReviewCountByDate}
        />
      )}
    </div>
  );
}
