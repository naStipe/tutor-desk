import type { SupabaseClient } from "@supabase/supabase-js";
import { listHomeworkNeedingAttention } from "../homework/data";
import { listLessonsInRange } from "../lessons/data";
import { addDays, startOfDay, startOfMonth, startOfWeek } from "../lessons/date-utils";
import { listActiveStudents } from "../students/data";
import type { Database } from "../../lib/supabase/database.types";

const TREND_WEEKS = 8;

type TrendLessonRow = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  student_id: string;
  subject_id: string | null;
};

function weekIndexFrom(trendStart: Date, startTime: Date) {
  return Math.floor((startTime.getTime() - trendStart.getTime()) / (7 * 86400000));
}

function dayIndexFrom(weekStart: Date, startTime: Date) {
  return Math.min(6, Math.max(0, Math.floor((startTime.getTime() - weekStart.getTime()) / 86400000)));
}

export async function getTodayDashboardData(supabase: SupabaseClient<Database>) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = addDays(dayStart, 1);
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const trendStart = addDays(weekStart, -7 * (TREND_WEEKS - 1));
  const monthStart = startOfMonth(now);
  const prevMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);

  const [
    weekLessons,
    homeworkAttention,
    unbilledCountResult,
    oldestUnbilledResult,
    trendResult,
    prevMonthResult,
    overdueHomeworkResult,
    students,
    upcomingResult,
    subjectsResult,
  ] = await Promise.all([
    // Today is a subset of this week, so the "Today" list is filtered from this in-memory
    // instead of running a second, near-identical range query.
    listLessonsInRange(supabase, { start: weekStart.toISOString(), end: weekEnd.toISOString() }),
    listHomeworkNeedingAttention(supabase, 5),
    supabase
      .from("lesson")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .eq("payment_status", "unpaid"),
    supabase
      .from("lesson")
      .select("start_time")
      .eq("status", "completed")
      .eq("payment_status", "unpaid")
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("lesson")
      .select("id, start_time, end_time, status, student_id, subject_id")
      .gte("start_time", trendStart.toISOString())
      .lt("start_time", weekEnd.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("lesson")
      .select("id, start_time, end_time, status")
      .gte("start_time", prevMonthStart.toISOString())
      .lt("start_time", monthStart.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("homework")
      .select("student_id, due_date")
      .eq("status", "assigned")
      .lt("due_date", now.toISOString()),
    listActiveStudents(supabase),
    supabase
      .from("lesson")
      .select("id, start_time, end_time, notes, student_id")
      .eq("status", "scheduled")
      .gte("start_time", now.toISOString())
      .order("start_time", { ascending: true })
      .limit(60),
    supabase.from("subject").select("id, name"),
  ]);

  if (unbilledCountResult.error)
    throw new Error(`Unable to load unbilled lessons: ${unbilledCountResult.error.message}`);
  if (oldestUnbilledResult.error)
    throw new Error(`Unable to load unbilled lessons: ${oldestUnbilledResult.error.message}`);
  if (trendResult.error) throw new Error(`Unable to load lesson trend: ${trendResult.error.message}`);
  if (prevMonthResult.error)
    throw new Error(`Unable to load lesson trend: ${prevMonthResult.error.message}`);
  if (overdueHomeworkResult.error)
    throw new Error(`Unable to load overdue homework: ${overdueHomeworkResult.error.message}`);
  if (upcomingResult.error)
    throw new Error(`Unable to load upcoming lessons: ${upcomingResult.error.message}`);
  if (subjectsResult.error) throw new Error(`Unable to load subjects: ${subjectsResult.error.message}`);

  const todaysLessons = weekLessons.filter((lesson) => {
    const start = new Date(lesson.start_time);
    return start >= dayStart && start < dayEnd;
  });

  const perDayMinutes = [0, 0, 0, 0, 0, 0, 0];
  let totalMinutes = 0;
  let loadCount = 0;
  for (const lesson of weekLessons) {
    if (lesson.status === "cancelled") continue;
    const start = new Date(lesson.start_time);
    const end = new Date(lesson.end_time);
    const minutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);
    const dayIndex = dayIndexFrom(weekStart, start);
    perDayMinutes[dayIndex] += minutes;
    totalMinutes += minutes;
    loadCount += 1;
  }

  const unbilled = {
    count: unbilledCountResult.count ?? 0,
    oldestDate: oldestUnbilledResult.data?.start_time ?? null,
  };

  // Weekly totals (for the trend chart + heatmap) and the same broken down per day and per
  // student (for the per-day heatmap cells and each student's mini sparkline).
  const weekMinutes = new Array<number>(TREND_WEEKS).fill(0);
  const heatmapMinutes: number[][] = Array.from({ length: TREND_WEEKS }, () => [0, 0, 0, 0, 0, 0, 0]);
  const studentWeekMinutes = new Map<string, number[]>();
  const subjectMonthMinutes = new Map<string, number>();
  const trendRows = (trendResult.data ?? []) as TrendLessonRow[];

  for (const lesson of trendRows) {
    const start = new Date(lesson.start_time);
    const end = new Date(lesson.end_time);
    const minutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);
    const wIndex = Math.min(TREND_WEEKS - 1, Math.max(0, weekIndexFrom(trendStart, start)));
    const dIndex = dayIndexFrom(addDays(trendStart, wIndex * 7), start);

    weekMinutes[wIndex] += minutes;
    heatmapMinutes[wIndex][dIndex] += minutes;

    let studentWeeks = studentWeekMinutes.get(lesson.student_id);
    if (!studentWeeks) {
      studentWeeks = new Array<number>(TREND_WEEKS).fill(0);
      studentWeekMinutes.set(lesson.student_id, studentWeeks);
    }
    studentWeeks[wIndex] += minutes;

    if (start >= monthStart) {
      const key = lesson.subject_id ?? "no-subject";
      subjectMonthMinutes.set(key, (subjectMonthMinutes.get(key) ?? 0) + minutes);
    }
  }

  const hoursTrend = weekMinutes.map((minutes) => minutes / 60);
  const heatmap = heatmapMinutes.map((week) => week.map((minutes) => minutes / 60));

  const monthMinutes = Array.from(subjectMonthMinutes.values()).reduce((sum, v) => sum + v, 0);
  const prevMonthMinutes = (prevMonthResult.data ?? []).reduce((sum, lesson) => {
    const minutes =
      (new Date(lesson.end_time).getTime() - new Date(lesson.start_time).getTime()) / 60000;
    return sum + Math.max(0, minutes);
  }, 0);
  const monthHours = monthMinutes / 60;
  const monthVsPrevPct =
    prevMonthMinutes > 0 ? Math.round(((monthMinutes - prevMonthMinutes) / prevMonthMinutes) * 100) : null;

  const subjectNameById = new Map((subjectsResult.data ?? []).map((s) => [s.id, s.name]));
  const subjectSplit = Array.from(subjectMonthMinutes.entries())
    .map(([id, minutes]) => ({
      // "no-subject": the lesson has no subject set. Otherwise the id came from a real
      // lesson.subject_id — fall back to "Other" only if that subject was since deleted.
      name: id === "no-subject" ? "No subject" : (subjectNameById.get(id) ?? "Other"),
      hours: minutes / 60,
      percent: monthMinutes > 0 ? Math.round((minutes / monthMinutes) * 100) : 0,
    }))
    .sort((a, b) => b.hours - a.hours);

  const overdueByStudent = new Map<string, boolean>();
  for (const row of overdueHomeworkResult.data ?? []) {
    overdueByStudent.set(row.student_id, true);
  }

  const nextLessonByStudent = new Map<string, { notes: string | null }>();
  const upcomingRows = upcomingResult.data ?? [];
  for (const row of upcomingRows) {
    if (!nextLessonByStudent.has(row.student_id)) {
      nextLessonByStudent.set(row.student_id, { notes: row.notes });
    }
  }

  const studentsOverview = (students ?? []).map((student) => {
    const weeks = studentWeekMinutes.get(student.id) ?? new Array<number>(TREND_WEEKS).fill(0);
    const sparkline = weeks.slice(1).map((minutes) => minutes / 60);
    const totalHours = weeks.reduce((sum, m) => sum + m, 0) / 60;
    const nextLesson = nextLessonByStudent.get(student.id);

    let status: "overdue" | "plan-missing" | "no-lesson" | "caught-up" = "caught-up";
    if (overdueByStudent.get(student.id)) status = "overdue";
    else if (nextLesson && (!nextLesson.notes || nextLesson.notes.trim() === "")) status = "plan-missing";
    else if (!nextLesson) status = "no-lesson";

    return { id: student.id, name: student.name, sparkline, totalHours, status };
  });

  // Upcoming lessons after today, for the "Next few days" list.
  const upcomingAfterToday = upcomingRows
    .filter((row) => new Date(row.start_time) >= dayEnd)
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      notes: row.notes,
      studentId: row.student_id,
    }));

  return {
    now,
    todaysLessons,
    homeworkAttention,
    unbilled,
    weekLoad: { lessonCount: loadCount, totalMinutes, perDayMinutes },
    analytics: {
      trendStart,
      hoursTrend,
      monthHours,
      monthVsPrevPct,
      subjectSplit,
      heatmap,
      studentsOverview,
      upcomingAfterToday,
      studentNames: Object.fromEntries((students ?? []).map((s) => [s.id, s.name])),
    },
  };
}
