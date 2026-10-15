// Pure maths for the landing-page "your week" calculator. The inputs are the visitor's own
// estimates; nothing here is stored or sent anywhere.
const WEEKS_PER_MONTH = 4.33;

export type WeekInput = { lessonsPerWeek: number; ratePerLesson: number; adminMinutes: number };

export function monthlyIncome({ lessonsPerWeek, ratePerLesson }: WeekInput): number {
  return Math.round(lessonsPerWeek * ratePerLesson * WEEKS_PER_MONTH);
}

export function weeklyAdminMinutes({ lessonsPerWeek, adminMinutes }: WeekInput): number {
  return lessonsPerWeek * adminMinutes;
}

export function weeklyAdminHours(input: WeekInput): number {
  return Math.round((weeklyAdminMinutes(input) / 60) * 10) / 10;
}

export function monthlyAdminHours(input: WeekInput): number {
  return Math.round((weeklyAdminMinutes(input) / 60) * WEEKS_PER_MONTH);
}

// "45 min" under an hour, otherwise "2 h" or "1.2 h", so a small number never reads as "0 h".
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${Math.round((minutes / 60) * 10) / 10} h`;
}
