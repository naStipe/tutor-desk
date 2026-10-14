// Pure maths for the landing-page "your week" calculator. The inputs are the visitor's own
// estimates; nothing here is stored or sent anywhere.
const WEEKS_PER_MONTH = 4.33;

export type WeekInput = { lessonsPerWeek: number; ratePerLesson: number; adminMinutes: number };

export function monthlyIncome({ lessonsPerWeek, ratePerLesson }: WeekInput): number {
  return Math.round(lessonsPerWeek * ratePerLesson * WEEKS_PER_MONTH);
}

export function weeklyAdminHours({ lessonsPerWeek, adminMinutes }: WeekInput): number {
  return Math.round(((lessonsPerWeek * adminMinutes) / 60) * 10) / 10;
}
