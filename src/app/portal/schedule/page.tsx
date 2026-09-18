import { redirect } from "next/navigation";
import {
  listHomeworkAwaitingReviewInRange,
  listHomeworkDueInRange,
} from "../../../features/homework/data";
import { StudentScheduleView } from "../../../features/lessons/components/StudentScheduleView";
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
import { listPortalLessons } from "../../../features/portal/data";
import { requirePortalStudent } from "../../../features/portal/resolve";
import { getTutorFormatSettings } from "../../../features/tutor-profile/data";
import { getCurrentUser } from "../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

type View = "day" | "week" | "month";

function buildHref(view: View, date: Date, studentId: string, showStudent: boolean) {
  const studentQuery = showStudent ? `&student=${studentId}` : "";
  return `/portal/schedule?view=${view}&date=${toDateParam(date)}${studentQuery}`;
}

function buildBaseHref(view: View, studentId: string, showStudent: boolean) {
  const studentQuery = showStudent ? `&student=${studentId}` : "";
  return `/portal/schedule?view=${view}${studentQuery}`;
}

export default async function PortalSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; student?: string }>;
}) {
  const { view: viewParam, date: dateParam, student: studentIdParam } = await searchParams;
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
  const student = await requirePortalStudent(supabase, studentIdParam);
  const showStudent = studentIdParam != null;

  const [
    lessons,
    homeworkDue,
    homeworkAwaitingReview,
    { timeZone, locale, workingHoursStartMinutes, workingHoursEndMinutes },
  ] = await Promise.all([
    listPortalLessons(supabase, student.id, {
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
    getTutorFormatSettings(supabase, student.tutor_id),
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
      ? buildHref("month", addMonths(monthAnchor, -1), student.id, showStudent)
      : buildHref(view, addDays(rangeStart, -step), student.id, showStudent);
  const nextHref =
    view === "month"
      ? buildHref("month", addMonths(monthAnchor, 1), student.id, showStudent)
      : buildHref(view, addDays(rangeStart, step), student.id, showStudent);

  const description =
    view === "day"
      ? formatDayHeading(rangeStart, timeZone, locale)
      : view === "month"
        ? formatMonthHeading(anchor, timeZone, locale)
        : formatWeekRange(rangeStart, timeZone, locale);

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
      todayHref={buildHref(view === "month" ? "month" : view, new Date(), student.id, showStudent)}
      dayHref={buildHref("day", anchor, student.id, showStudent)}
      weekHref={buildHref("week", anchor, student.id, showStudent)}
      monthHref={buildHref("month", anchor, student.id, showStudent)}
      monthBaseHref={buildBaseHref("month", student.id, showStudent)}
      dayBaseHref={buildBaseHref("day", student.id, showStudent)}
      view={view}
      dayStartValues={days.map(toLocalMidnightValue)}
      lessons={calendarLessons}
      monthCountByDate={countByDate}
      monthAnchorValue={toLocalMidnightValue(anchor)}
      homeworkDueCountByDate={homeworkDueCountByDate}
      homeworkReviewCountByDate={homeworkReviewCountByDate}
      timeZone={timeZone}
      locale={locale}
      workingHoursStartMinutes={workingHoursStartMinutes}
      workingHoursEndMinutes={workingHoursEndMinutes}
    />
  );
}
