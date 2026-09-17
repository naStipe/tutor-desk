import { redirect } from "next/navigation";
import { LessonsCalendarView } from "../../../features/lessons/components/LessonsCalendarView";
import {
  addDays,
  addMonths,
  formatAgendaDate,
  formatDayHeading,
  formatMonthHeading,
  formatWeekRange,
  parseDateParam,
  startOfDay,
  startOfMonth,
  startOfWeek,
  toDateParam,
  toDateParamInZone,
  toLocalMidnightValue,
} from "../../../features/lessons/date-utils";
import { listLessonSlotsInRange, listLessonsInRange } from "../../../features/lessons/data";
import { buildRatesByStudent } from "../../../features/lessons/rates-map";
import { ensureUpcomingLessonsGenerated } from "../../../features/lessons/recurrence";
import {
  listHomeworkAwaitingReviewInRange,
  listHomeworkDueInRange,
} from "../../../features/homework/data";
import { listRatesForTutor } from "../../../features/rates/data";
import { listActiveStudents } from "../../../features/students/data";
import { listSubjects } from "../../../features/subjects/data";
import { getTutorFormatSettings } from "../../../features/tutor-profile/data";
import { cachedForTutor, tutorTag } from "../../../lib/query-cache";
import { getCurrentUser } from "../../../lib/supabase/current-user";
import { createTokenClient } from "../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

type View = "day" | "week" | "month";

function buildHref(view: View, date: Date, highlight?: string) {
  const highlightParam = highlight ? `&highlight=${highlight}` : "";
  return `/dashboard/schedule?view=${view}&date=${toDateParam(date)}${highlightParam}`;
}

const PICKER_WINDOW_PAST_DAYS = 7;
const PICKER_WINDOW_FUTURE_DAYS = 120;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    date?: string;
    create?: string;
    highlight?: string;
  }>;
}) {
  const {
    view: viewParam,
    date: dateParam,
    create: createParam,
    highlight: highlightParam,
  } = await searchParams;
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

  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;

  // Series generation is a write path that's expensive to check on every navigation (it queries
  // every active recurring series). It only matters once new occurrences fall due, so gate the
  // check itself behind a cache tagged with the tutor's lessons — any lesson mutation invalidates
  // it, but plain week/day/month browsing reuses the last result for up to an hour.
  const generatedNewLessons = await cachedForTutor(
    "ensure-lessons-generated",
    [user.id],
    [tutorTag("lessons", user.id)],
    3600,
    () => ensureUpcomingLessonsGenerated(client, user.id),
  );

  const fetchLessonsForRange = () =>
    listLessonsInRange(client, {
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
    });

  const pickerStart = addDays(startOfDay(new Date()), -PICKER_WINDOW_PAST_DAYS);
  const pickerEnd = addDays(startOfDay(new Date()), PICKER_WINDOW_FUTURE_DAYS);
  const fetchPickerLessons = () =>
    listLessonSlotsInRange(client, {
      start: pickerStart.toISOString(),
      end: pickerEnd.toISOString(),
    });

  const [
    lessons,
    students,
    subjects,
    rates,
    pickerLessons,
    homeworkDue,
    homeworkAwaitingReview,
    { timeZone, locale },
  ] = await Promise.all([
      generatedNewLessons
        ? fetchLessonsForRange()
        : cachedForTutor(
            "lessons-range",
            [user.id, rangeStart.toISOString(), rangeEnd.toISOString()],
            [tutorTag("lessons", user.id)],
            30,
            fetchLessonsForRange,
          ),
      cachedForTutor("students-active", [user.id], [tutorTag("students", user.id)], 120, () =>
        listActiveStudents(client),
      ),
      cachedForTutor("subjects", [user.id], [tutorTag("subjects", user.id)], 120, () =>
        listSubjects(client),
      ),
      cachedForTutor("rates", [user.id], [tutorTag("rates", user.id)], 120, () =>
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
      cachedForTutor(
        "homework-due-range",
        [user.id, rangeStart.toISOString(), rangeEnd.toISOString()],
        [tutorTag("homework", user.id)],
        30,
        () =>
          listHomeworkDueInRange(client, {
            start: rangeStart.toISOString(),
            end: rangeEnd.toISOString(),
          }),
      ),
      cachedForTutor(
        "homework-awaiting-review-range",
        [user.id, rangeStart.toISOString(), rangeEnd.toISOString()],
        [tutorTag("homework", user.id)],
        30,
        () =>
          listHomeworkAwaitingReviewInRange(client, {
            start: rangeStart.toISOString(),
            end: rangeEnd.toISOString(),
          }),
      ),
      cachedForTutor("format-settings", [user.id], [tutorTag("profile", user.id)], 300, () =>
        getTutorFormatSettings(client, user.id),
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
      const key = toDateParamInZone(new Date(lesson.start_time), timeZone);
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
    const key = toDateParamInZone(new Date(item.submitted_at), timeZone);
    homeworkReviewCountByDate[key] = (homeworkReviewCountByDate[key] ?? 0) + 1;
  }

  const agendaLessons = lessons.map((lesson) => ({
    id: lesson.id,
    studentName: lesson.student?.name ?? "Unknown student",
    subjectName: lesson.subject?.name ?? null,
    startTime: lesson.start_time,
    status: lesson.status as "scheduled" | "completed" | "cancelled" | "no_show",
    paymentStatus: lesson.payment_status,
  }));

  const agendaHomework = [
    ...homeworkDue.map((item) => ({
      id: item.id,
      title: item.title,
      studentName: item.student?.name ?? "Unknown student",
      subjectName: item.subject?.name ?? null,
      status: item.status,
      dateLabel: item.due_date ? `Due ${formatAgendaDate(item.due_date, locale)}` : "No due date",
      sortValue: item.due_date ?? "",
    })),
    ...homeworkAwaitingReview.map((item) => ({
      id: item.id,
      title: item.title,
      studentName: item.student?.name ?? "Unknown student",
      subjectName: item.subject?.name ?? null,
      status: item.status,
      dateLabel: item.submitted_at
        ? `Submitted ${new Date(item.submitted_at).toLocaleDateString(locale, { month: "short", day: "numeric", timeZone })}`
        : "Submitted",
      sortValue: item.submitted_at ?? "",
    })),
  ].sort((a, b) => a.sortValue.localeCompare(b.sortValue));

  return (
    <LessonsCalendarView
      title="Schedule"
      description={description}
      prevHref={prevHref}
      nextHref={nextHref}
      todayHref={buildHref(view === "month" ? "month" : view, new Date())}
      dayHref={buildHref("day", anchor)}
      weekHref={buildHref("week", anchor)}
      monthHref={buildHref("month", anchor)}
      view={view}
      dayStartValues={days.map(toLocalMidnightValue)}
      lessons={calendarLessons}
      students={students}
      subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
      ratesByStudent={buildRatesByStudent(rates, students)}
      pickerLessons={pickerLessons.map((lesson) => ({
        id: lesson.id,
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        status: lesson.status,
      }))}
      initialCreate={createParam === "1"}
      highlightLessonId={highlightParam ?? null}
      monthCountByDate={countByDate}
      monthAnchorValue={toLocalMidnightValue(anchor)}
      homeworkDueCountByDate={homeworkDueCountByDate}
      homeworkReviewCountByDate={homeworkReviewCountByDate}
      agendaLessons={agendaLessons}
      agendaHomework={agendaHomework}
      timeZone={timeZone}
      locale={locale}
    />
  );
}
