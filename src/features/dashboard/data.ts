import type { SupabaseClient } from "@supabase/supabase-js";
import { listHomeworkNeedingAttention } from "../homework/data";
import { listLessonsInRange } from "../lessons/data";
import { addDays, startOfDay, startOfWeek } from "../lessons/date-utils";
import type { Database } from "../../lib/supabase/database.types";

export async function getTodayDashboardData(supabase: SupabaseClient<Database>) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = addDays(dayStart, 1);
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);

  const [todaysLessons, weekLessons, homeworkAttention, completedLessons] = await Promise.all([
    listLessonsInRange(supabase, { start: dayStart.toISOString(), end: dayEnd.toISOString() }),
    listLessonsInRange(supabase, { start: weekStart.toISOString(), end: weekEnd.toISOString() }),
    listHomeworkNeedingAttention(supabase, 5),
    supabase
      .from("lesson")
      .select("id, start_time")
      .eq("status", "completed")
      .eq("payment_status", "unpaid")
      .order("start_time", { ascending: true }),
  ]);

  if (completedLessons.error)
    throw new Error(`Unable to load unbilled lessons: ${completedLessons.error.message}`);

  const perDayMinutes = [0, 0, 0, 0, 0, 0, 0];
  let totalMinutes = 0;
  let loadCount = 0;
  for (const lesson of weekLessons) {
    if (lesson.status === "cancelled") continue;
    const start = new Date(lesson.start_time);
    const end = new Date(lesson.end_time);
    const minutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);
    const dayIndex = Math.min(
      6,
      Math.max(0, Math.floor((start.getTime() - weekStart.getTime()) / 86400000)),
    );
    perDayMinutes[dayIndex] += minutes;
    totalMinutes += minutes;
    loadCount += 1;
  }

  const completedRows = completedLessons.data ?? [];
  const unbilled = {
    count: completedRows.length,
    oldestDate: completedRows[0]?.start_time ?? null,
  };

  return {
    now,
    todaysLessons,
    homeworkAttention,
    unbilled,
    weekLoad: { lessonCount: loadCount, totalMinutes, perDayMinutes },
  };
}
