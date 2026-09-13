import type { RatesByStudent } from "./components/LessonForm";

export function buildRatesByStudent(
  rates: { student_id: string; subject_id: string; hourly_rate: number; currency: string }[],
): RatesByStudent {
  const map: RatesByStudent = {};
  for (const rate of rates) {
    map[rate.student_id] ??= {};
    map[rate.student_id][rate.subject_id] = {
      hourlyRate: rate.hourly_rate,
      currency: rate.currency,
    };
  }
  return map;
}
