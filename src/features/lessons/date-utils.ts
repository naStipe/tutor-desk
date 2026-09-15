function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function startOfWeek(date: Date) {
  const result = startOfDay(date);
  const day = result.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);
  return result;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** Combines a local YYYY-MM-DD date with minutes-since-midnight into a Date. */
export function combineDateAndMinutes(dateParam: string, minutes: number) {
  const [year, month, day] = dateParam.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

/** Local YYYY-MM-DD, for calendar navigation query params. */
export function toDateParam(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Local midnight as an explicit-time ISO-shaped string (no "Z"/offset), safe to pass from a
 * Server to a Client Component and reconstruct with `new Date(value)` without the UTC-parsing
 * trap that a bare "YYYY-MM-DD" string has (that form is parsed as UTC midnight by the spec).
 */
export function toLocalMidnightValue(date: Date) {
  return `${toDateParam(date)}T00:00:00`;
}

export function parseDateParam(value: string | undefined): Date {
  if (value) {
    const [year, month, day] = value.split("-").map(Number);
    if (year && month && day) return new Date(year, month - 1, day);
  }
  return new Date();
}

// Falls back to a fixed locale when the tutor's own locale isn't known yet, keeping date/time
// text readable regardless of the server's OS locale (observed to render malformed strings for
// some option combinations under non-US locales).
const DISPLAY_LOCALE = "en-US";

export function formatDayHeading(date: Date, timeZone?: string, locale = DISPLAY_LOCALE) {
  return date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  });
}

export function formatWeekRange(weekStart: Date, timeZone?: string, locale = DISPLAY_LOCALE) {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = weekStart.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone,
  });
  // Always include the month (some JS date-formatting implementations mis-render a
  // day+year-only combination), even when start and end fall in the same month.
  const endLabel = weekEnd.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
  return `${startLabel} – ${endLabel}`;
}

export function formatTimeRange(
  startIso: string,
  endIso: string,
  timeZone?: string,
  locale = DISPLAY_LOCALE,
) {
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", timeZone };
  const start = new Date(startIso).toLocaleTimeString(locale, options);
  const end = new Date(endIso).toLocaleTimeString(locale, options);
  return `${start} – ${end}`;
}

export function formatFullDateTime(iso: string, timeZone?: string, locale = DISPLAY_LOCALE) {
  return new Date(iso).toLocaleString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function formatHourLabel(hour: number) {
  const period = hour < 12 || hour === 24 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${period}`;
}

export function formatWeekdayShort(date: Date, timeZone?: string, locale = DISPLAY_LOCALE) {
  return date.toLocaleDateString(locale, { weekday: "short", timeZone });
}

export function formatMonthHeading(date: Date, timeZone?: string, locale = DISPLAY_LOCALE) {
  return date.toLocaleDateString(locale, { month: "long", year: "numeric", timeZone });
}

export function formatMinutesOfDay(minutes: number) {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${pad(minute)} ${period}`;
}
