import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import { getRate } from "../rates/data";
import { addDays, startOfDay, toDateParam } from "./date-utils";
import {
  insertGeneratedLessons,
  listActiveLessonSeriesForGeneration,
  updateSeriesGeneratedUntil,
} from "./data";

/** How far into the future active recurring series stay topped up with generated lessons. */
const GENERATION_WINDOW_DAYS = 56;

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/**
 * Rolling recurrence generation, run just-in-time on normal page loads (no cron/service-role
 * needed): tops up any active `lesson_series` whose `generated_until` has fallen behind the
 * rolling horizon, under the caller's own RLS session. Returns whether any lessons were
 * inserted, so a caller reading through a short-TTL cache can bypass it for this request.
 */
export async function ensureUpcomingLessonsGenerated(
  supabase: SupabaseClient<Database>,
  tutorId: string,
) {
  const horizon = addDays(startOfDay(new Date()), GENERATION_WINDOW_DAYS);
  const horizonParam = toDateParam(horizon);

  const seriesList = await listActiveLessonSeriesForGeneration(supabase, horizonParam);
  if (seriesList.length === 0) return;

  let generatedAny = false;

  for (const series of seriesList) {
    const seriesEndDate = series.end_date ? parseDateOnly(series.end_date) : null;
    const until = seriesEndDate && seriesEndDate < horizon ? seriesEndDate : horizon;

    const generatedUntilDate = parseDateOnly(series.generated_until);
    const startDate = parseDateOnly(series.start_date);
    let cursor = generatedUntilDate >= startDate ? addDays(generatedUntilDate, 1) : startDate;
    while (cursor.getDay() !== series.day_of_week && cursor <= until) {
      cursor = addDays(cursor, 1);
    }

    const rate = series.subject_id
      ? await getRate(supabase, series.student_id, series.subject_id)
      : null;
    const price = rate
      ? Math.round(((rate.hourly_rate * series.duration_minutes) / 60) * 100) / 100
      : null;

    const rows: Parameters<typeof insertGeneratedLessons>[1] = [];
    while (cursor <= until) {
      const startTime = new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate(),
        Math.floor(series.start_minutes / 60),
        series.start_minutes % 60,
        0,
        0,
      );
      const endTime = new Date(startTime.getTime() + series.duration_minutes * 60000);

      rows.push({
        tutorId,
        studentId: series.student_id,
        subjectId: series.subject_id,
        seriesId: series.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        price,
        currency: rate?.currency ?? null,
      });

      cursor = addDays(cursor, 7);
    }

    if (rows.length > 0) {
      await insertGeneratedLessons(supabase, rows);
      generatedAny = true;
    }

    if (until > generatedUntilDate) {
      await updateSeriesGeneratedUntil(supabase, series.id, toDateParam(until));
    }
  }

  return generatedAny;
}
