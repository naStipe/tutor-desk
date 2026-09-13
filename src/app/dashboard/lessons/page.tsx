import Link from "next/link";
import { LinkButton } from "../../../components/Button";
import { PageHeader } from "../../../components/PageHeader";
import { StatusBadge } from "../../../features/lessons/components/StatusBadge";
import {
  addDays,
  formatDayHeading,
  formatTimeRange,
  formatWeekRange,
  parseDateParam,
  startOfDay,
  startOfWeek,
  toDateParam,
} from "../../../features/lessons/date-utils";
import { listLessonsInRange, type LessonWithStudent } from "../../../features/lessons/data";
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
  const lessons = await listLessonsInRange(supabase, {
    start: rangeStart.toISOString(),
    end: rangeEnd.toISOString(),
  });

  const days = Array.from({ length: rangeDays }, (_, index) => addDays(rangeStart, index));
  const lessonsByDay = new Map<string, LessonWithStudent[]>(
    days.map((day) => [toDateParam(day), []]),
  );
  for (const lesson of lessons) {
    const key = toDateParam(new Date(lesson.start_time));
    lessonsByDay.get(key)?.push(lesson);
  }

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

      <div className="space-y-4">
        {days.map((day) => {
          const key = toDateParam(day);
          const dayLessons = lessonsByDay.get(key) ?? [];
          return (
            <div key={key} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{formatDayHeading(day)}</p>
              </div>
              {dayLessons.length === 0 ? (
                <p className="px-4 py-5 text-sm text-slate-400">No lessons scheduled.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {dayLessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/dashboard/lessons/${lesson.id}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {formatTimeRange(lesson.start_time, lesson.end_time)}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {lesson.student?.name ?? "Unknown student"}
                          </p>
                        </div>
                        <StatusBadge status={lesson.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
