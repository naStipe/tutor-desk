import { redirect } from "next/navigation";
import { LessonsCalendarView } from "../../../features/lessons/components/LessonsCalendarView";
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
import { buildRatesByStudent } from "../../../features/lessons/rates-map";
import { ensureUpcomingLessonsGenerated } from "../../../features/lessons/recurrence";
import { listRatesForTutor } from "../../../features/rates/data";
import { listActiveStudents } from "../../../features/students/data";
import { listSubjects } from "../../../features/subjects/data";
import { cachedForTutor, tutorTag } from "../../../lib/query-cache";
import { getCurrentUser } from "../../../lib/supabase/current-user";
import { createTokenClient } from "../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

type View = "day" | "week";

function buildHref(view: View, date: Date, highlight?: string) {
  const highlightParam = highlight ? `&highlight=${highlight}` : "";
  return `/dashboard/lessons?view=${view}&date=${toDateParam(date)}${highlightParam}`;
}

const PICKER_WINDOW_PAST_DAYS = 7;
const PICKER_WINDOW_FUTURE_DAYS = 120;

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; create?: string; highlight?: string }>;
}) {
  const {
    view: viewParam,
    date: dateParam,
    create: createParam,
    highlight: highlightParam,
  } = await searchParams;
  const view: View = viewParam === "day" ? "day" : "week";
  const anchor = parseDateParam(dateParam);

  const rangeStart = view === "day" ? startOfDay(anchor) : startOfWeek(anchor);
  const rangeDays = view === "day" ? 1 : 7;
  const rangeEnd = addDays(rangeStart, rangeDays);

  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;
  const generatedNewLessons = await ensureUpcomingLessonsGenerated(client, user.id);

  const fetchLessonsForRange = () =>
    listLessonsInRange(client, {
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
    });

  const pickerStart = addDays(startOfDay(new Date()), -PICKER_WINDOW_PAST_DAYS);
  const pickerEnd = addDays(startOfDay(new Date()), PICKER_WINDOW_FUTURE_DAYS);
  const fetchPickerLessons = () =>
    listLessonsInRange(client, {
      start: pickerStart.toISOString(),
      end: pickerEnd.toISOString(),
    });

  const [lessons, students, subjects, rates, pickerLessons] = await Promise.all([
    generatedNewLessons
      ? fetchLessonsForRange()
      : cachedForTutor(
          "lessons-range",
          [user.id, rangeStart.toISOString(), rangeEnd.toISOString()],
          [tutorTag("lessons", user.id)],
          30,
          fetchLessonsForRange,
        ),
    cachedForTutor("students-active", [user.id], [tutorTag("students", user.id)], 30, () =>
      listActiveStudents(client),
    ),
    cachedForTutor("subjects", [user.id], [tutorTag("subjects", user.id)], 30, () =>
      listSubjects(client),
    ),
    cachedForTutor("rates", [user.id], [tutorTag("rates", user.id)], 30, () =>
      listRatesForTutor(client),
    ),
    generatedNewLessons
      ? fetchPickerLessons()
      : cachedForTutor(
          "lessons-picker",
          [user.id, pickerStart.toISOString(), pickerEnd.toISOString()],
          [tutorTag("lessons", user.id)],
          30,
          fetchPickerLessons,
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

  const step = view === "day" ? 1 : 7;

  return (
    <LessonsCalendarView
      title="Lessons"
      description={view === "day" ? formatDayHeading(rangeStart) : formatWeekRange(rangeStart)}
      prevHref={buildHref(view, addDays(rangeStart, -step))}
      nextHref={buildHref(view, addDays(rangeStart, step))}
      todayHref={buildHref(view, new Date())}
      dayHref={buildHref("day", anchor)}
      weekHref={buildHref("week", anchor)}
      view={view}
      dayStartValues={days.map(toLocalMidnightValue)}
      lessons={calendarLessons}
      students={students}
      subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
      ratesByStudent={buildRatesByStudent(rates)}
      pickerLessons={pickerLessons.map((lesson) => ({
        id: lesson.id,
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        status: lesson.status,
      }))}
      initialCreate={createParam === "1"}
      highlightLessonId={highlightParam ?? null}
    />
  );
}
