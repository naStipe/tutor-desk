import { redirect } from "next/navigation";
import { EmptyState } from "../../../../components/EmptyState";
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
} from "../../../../features/lessons/date-utils";
import { listLessonsInRange } from "../../../../features/lessons/data";
import { StudentScheduleView } from "../../../../features/lessons/components/StudentScheduleView";
import { listHomeworkDueInRange } from "../../../../features/homework/data";
import { resolveViewedStudent } from "../../../../features/student-view/resolve";
import { cachedForTutor, tutorTag } from "../../../../lib/query-cache";
import { getCurrentUser } from "../../../../lib/supabase/current-user";
import { createTokenClient } from "../../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

type View = "day" | "week" | "month";

function buildHref(
  studentId: string,
  view: View,
  date: Date,
  showHomework?: boolean,
) {
  const homeworkParam = showHomework ? "&homework=1" : "";
  return `/dashboard/student-view/schedule?view=${view}&date=${toDateParam(date)}&student=${studentId}${homeworkParam}`;
}

function buildBaseHref(studentId: string, view: View, showHomework?: boolean) {
  const homeworkParam = showHomework ? "&homework=1" : "";
  return `/dashboard/student-view/schedule?view=${view}&student=${studentId}${homeworkParam}`;
}

export default async function StudentViewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{
    student?: string;
    view?: string;
    date?: string;
    homework?: string;
  }>;
}) {
  const {
    student: studentParam,
    view: viewParam,
    date: dateParam,
    homework: homeworkParam,
  } = await searchParams;
  const showHomework = homeworkParam === "1";
  const view: View = viewParam === "day" ? "day" : viewParam === "month" ? "month" : "week";
  const anchor = parseDateParam(dateParam);

  const rangeStart =
    view === "day" ? startOfDay(anchor) : view === "month" ? startOfWeek(startOfMonth(anchor)) : startOfWeek(anchor);
  const rangeDays = view === "day" ? 1 : view === "month" ? 42 : 7;
  const rangeEnd = addDays(rangeStart, rangeDays);

  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;
  const { selected } = await resolveViewedStudent(client, studentParam);

  if (!selected) {
    return (
      <EmptyState
        title="No students yet"
        description="Add a student to preview what their schedule would look like."
      />
    );
  }

  const [lessons, homeworkDue] = await Promise.all([
    cachedForTutor(
      "student-view-lessons-range",
      [user.id, selected.id, rangeStart.toISOString(), rangeEnd.toISOString()],
      [tutorTag("lessons", user.id)],
      30,
      () =>
        listLessonsInRange(
          client,
          { start: rangeStart.toISOString(), end: rangeEnd.toISOString() },
          { studentId: selected.id },
        ),
    ),
    cachedForTutor(
      "student-view-homework-due-range",
      [user.id, selected.id, rangeStart.toISOString(), rangeEnd.toISOString()],
      [tutorTag("homework", user.id)],
      30,
      () =>
        listHomeworkDueInRange(
          client,
          { start: rangeStart.toISOString(), end: rangeEnd.toISOString() },
          { studentId: selected.id },
        ),
    ),
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
      ? buildHref(selected.id, "month", addMonths(monthAnchor, -1), showHomework)
      : buildHref(selected.id, view, addDays(rangeStart, -step), showHomework);
  const nextHref =
    view === "month"
      ? buildHref(selected.id, "month", addMonths(monthAnchor, 1), showHomework)
      : buildHref(selected.id, view, addDays(rangeStart, step), showHomework);

  const description =
    view === "day"
      ? formatDayHeading(rangeStart)
      : view === "month"
        ? formatMonthHeading(anchor)
        : formatWeekRange(rangeStart);

  const homeworkCountByDate: Record<string, number> = {};
  for (const item of homeworkDue) {
    if (!item.due_date) continue;
    homeworkCountByDate[item.due_date] = (homeworkCountByDate[item.due_date] ?? 0) + 1;
  }

  return (
    <StudentScheduleView
      studentName={selected.name}
      description={description}
      prevHref={prevHref}
      nextHref={nextHref}
      todayHref={buildHref(selected.id, view === "month" ? "month" : view, new Date(), showHomework)}
      dayHref={buildHref(selected.id, "day", anchor, showHomework)}
      weekHref={buildHref(selected.id, "week", anchor, showHomework)}
      monthHref={buildHref(selected.id, "month", anchor, showHomework)}
      monthBaseHref={buildBaseHref(selected.id, "month", showHomework)}
      dayBaseHref={buildBaseHref(selected.id, "day", showHomework)}
      view={view}
      dayStartValues={days.map(toLocalMidnightValue)}
      lessons={calendarLessons}
      showHomework={showHomework}
      monthCountByDate={countByDate}
      monthAnchorValue={toLocalMidnightValue(anchor)}
      homeworkCountByDate={homeworkCountByDate}
      homeworkItems={homeworkDue.map((item) => ({
        id: item.id,
        title: item.title,
        studentName: item.student?.name ?? "Unknown student",
        dueDate: item.due_date as string,
        status: item.status,
      }))}
    />
  );
}
