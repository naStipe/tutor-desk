import type { RatesByStudent } from "./components/LessonForm";

/** Key used to store a student's default rate (no specific subject) in the rates map. */
export const DEFAULT_RATE_KEY = "";

export function buildRatesByStudent(
  rates: { student_id: string; subject_id: string; hourly_rate: number; currency: string }[],
  students: { id: string; default_hourly_rate: number | null; default_currency: string | null }[] = [],
): RatesByStudent {
  const map: RatesByStudent = {};

  for (const student of students) {
    if (student.default_hourly_rate === null) continue;
    map[student.id] ??= {};
    map[student.id][DEFAULT_RATE_KEY] = {
      hourlyRate: student.default_hourly_rate,
      currency: student.default_currency ?? "RUB",
    };
  }

  for (const rate of rates) {
    map[rate.student_id] ??= {};
    map[rate.student_id][rate.subject_id] = {
      hourlyRate: rate.hourly_rate,
      currency: rate.currency,
    };
  }

  return map;
}
