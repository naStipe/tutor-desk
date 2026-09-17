import { redirect } from "next/navigation";
import {
  addDays,
  addMonths,
  formatDayHeading,
  formatMonthHeading,
  formatWeekRange,
  parseDateParam,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateParam,
  toLocalMidnightValue,
} from "../../../features/lessons/date-utils";
import { StudentScheduleView } from "../../../features/lessons/components/StudentScheduleView";
import {
  listHomeworkAwaitingReviewInRange,
  listHomeworkDueInRange,
} from "../../../features/homework/data";
import { listPortalLessons } from "../../../features/portal/data";
import { requirePortalStudent } from "../../../features/portal/resolve";
import { getCurrentUser } from "../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

type View = "day" | "week" | "month";

function buildHref(view: View, date: Date) {
  return `/portal/schedule?view=${view}&date=${toDateParam(date)}`;
}

function buildBaseHref(view: View) {
  return `/portal/schedule?view=${view}`;
}

export default async function PortalSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: viewParam, date: dateParam } = await searchParams;
  const view: View = viewParam === "day" ? "day" : viewParam === "month" ? "month" : "week";
  const anchor = parseDateParam(dateParam);

  const rangeStart =
    view === "day"
      ? startOfDay(anchor)
      : view === "month"
        ? startOfWeek(startOfMonth(anchor))
        : startOfWeek(anchor);
  const rangeDays = view === "day" ? 1 : view === "month" ? 42 : 7;
  const rangeEnd = addDays(rangeStart, rangeDays);

  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const student = await requirePortalStudent(supabase);

  const [lessons, homeworkDue, homeworkAwaitingReview] = await Promise.all([
    listPortalLessons(supabase, {
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
    }),
    listHomeworkDueInRange(
      supabase,
      { start: rangeStart.toISOString(), end: rangeEnd.toISOString() },
      { studentId: student.id },
    ),
    listHomeworkAwaitingReviewInRange(
      supabase,
      { start: rangeStart.toISOString(), end: rangeEnd.toISOString() },
      { studentId: student.id },
    ),
  ]);

  const days = Array.from({ length: rangeDays }, (_, index) => addDays(rangeStart, index));
  const calendarLessons = lessons.map((lesson) => ({
    id: lesson.id,
    studentId: lesson.student_id,
    studentName: student.name,
    startTime: lesson.start_time,
    endTime: lesson.end_time,
    status: lesson.status as "scheduled" | "completed" | "cancelled" | "no_show",
  }));

  const countByDate: Record<string, number> = {};
  if (view === "month") {
    for (const lesson of lessons) {
      if (lesson.status === "cancelled") continue;
      const key = toDateParam(new Date(lesson.start_time));
      countByDate[key] = (countByDate[key] ?? 0) + 1;
    }
  }

  const step = view === "day" ? 1 : view === "month" ? 0 : 7;
  const monthAnchor = startOfMonth(anchor);
  const prevHref =
    view === "month"
      ? buildHref("month", addMonths(monthAnchor, -1))
      : buildHref(view, addDays(rangeStart, -step));
  const nextHref =
    view === "month"
      ? buildHref("month", addMonths(monthAnchor, 1))
      : buildHref(view, addDays(rangeStart, step));

  const description =
    view === "day"
      ? formatDayHeading(rangeStart)
      : view === "month"
        ? formatMonthHeading(anchor)
        : formatWeekRange(rangeStart);

  const homeworkDueCountByDate: Record<string, number> = {};
  for (const item of homeworkDue) {
    if (!item.due_date) continue;
    homeworkDueCountByDate[item.due_date] = (homeworkDueCountByDate[item.due_date] ?? 0) + 1;
  }

  const homeworkReviewCountByDate: Record<string, number> = {};
  for (const item of homeworkAwaitingReview) {
    if (!item.submitted_at) continue;
    const key = toDateParam(new Date(item.submitted_at));
    homeworkReviewCountByDate[key] = (homeworkReviewCountByDate[key] ?? 0) + 1;
  }

  return (
    <StudentScheduleView
      studentName={student.name}
      description={description}
      prevHref={prevHref}
      nextHref={nextHref}
      todayHref={buildHref(view === "month" ? "month" : view, new Date())}
      dayHref={buildHref("day", anchor)}
      weekHref={buildHref("week", anchor)}
      monthHref={buildHref("month", anchor)}
      monthBaseHref={buildBaseHref("month")}
      dayBaseHref={buildBaseHref("day")}
      view={view}
      dayStartValues={days.map(toLocalMidnightValue)}
      lessons={calendarLessons}
      monthCountByDate={countByDate}
      monthAnchorValue={toLocalMidnightValue(anchor)}
      homeworkDueCountByDate={homeworkDueCountByDate}
      homeworkReviewCountByDate={homeworkReviewCountByDate}
    />
  );
}
