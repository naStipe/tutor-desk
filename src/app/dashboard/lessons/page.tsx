import Link from "next/link";
import { LinkButton } from "../../../components/Button";
import { PageHeader } from "../../../components/PageHeader";
import { LessonCalendar } from "../../../features/lessons/components/LessonCalendar";
import {
  addDays,
  formatDayHeading,
  formatWeekRange,
  parseDateParam,
  startOfDay,
  startOfWeek,
  toDateParam,
  toLocalMidnightValue,
} from "../../../features/lessons/date-utils";
import { listLessonsInRange } from "../../../features/lessons/data";
import { listActiveStudents } from "../../../features/students/data";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type View = "day" | "week";

function buildHref(view: View, date: Date) {
  return `/dashboard/lessons?view=${view}&date=${toDateParam(date)}`;
}

const navLinkClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50";
const toggleActiveClass = "rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white";
const toggleInactiveClass =
  "rounded-md px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: viewParam, date: dateParam } = await searchParams;
  const view: View = viewParam === "day" ? "day" : "week";
  const anchor = parseDateParam(dateParam);

  const rangeStart = view === "day" ? startOfDay(anchor) : startOfWeek(anchor);
  const rangeDays = view === "day" ? 1 : 7;
  const rangeEnd = addDays(rangeStart, rangeDays);

  const supabase = await createClient();
  const [lessons, students] = await Promise.all([
    listLessonsInRange(supabase, {
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
    }),
    listActiveStudents(supabase),
  ]);

  const days = Array.from({ length: rangeDays }, (_, index) => addDays(rangeStart, index));
  const calendarLessons = lessons.map((lesson) => ({
    id: lesson.id,
    studentId: lesson.student_id,
    studentName: lesson.student?.name ?? "Unknown student",
    startTime: lesson.start_time,
    endTime: lesson.end_time,
    status: lesson.status as "scheduled" | "completed" | "cancelled" | "no_show",
  }));

  const step = view === "day" ? 1 : 7;
  const prevHref = buildHref(view, addDays(rangeStart, -step));
  const nextHref = buildHref(view, addDays(rangeStart, step));
  const todayHref = buildHref(view, new Date());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lessons"
        description={view === "day" ? formatDayHeading(rangeStart) : formatWeekRange(rangeStart)}
        actions={<LinkButton href="/dashboard/lessons/new">Schedule lesson</LinkButton>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <Link
            href={buildHref("day", anchor)}
            className={view === "day" ? toggleActiveClass : toggleInactiveClass}
          >
            Day
          </Link>
          <Link
            href={buildHref("week", anchor)}
            className={view === "week" ? toggleActiveClass : toggleInactiveClass}
          >
            Week
          </Link>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Click an empty slot to schedule a lesson, or drag a lesson to reschedule it.
      </p>

      <LessonCalendar
        dayStartValues={days.map(toLocalMidnightValue)}
        lessons={calendarLessons}
        students={students}
      />
    </div>
  );
}
