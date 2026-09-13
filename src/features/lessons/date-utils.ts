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

/** Local YYYY-MM-DDTHH:mm, for <input type="datetime-local"> values. */
export function toDateTimeLocalValue(isoOrDate: string | Date) {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Converts a <input type="datetime-local"> value (interpreted in the browser's local time) to ISO. */
export function dateTimeLocalToISO(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

// A fixed locale keeps date/time text readable regardless of the server's OS locale
// (observed to render malformed strings for some option combinations under non-US locales).
const DISPLAY_LOCALE = "en-US";

export function formatDayHeading(date: Date) {
  return date.toLocaleDateString(DISPLAY_LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = weekStart.toLocaleDateString(DISPLAY_LOCALE, {
    month: "short",
    day: "numeric",
  });
  // Always include the month (some JS date-formatting implementations mis-render a
  // day+year-only combination), even when start and end fall in the same month.
  const endLabel = weekEnd.toLocaleDateString(DISPLAY_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

export function formatTimeRange(startIso: string, endIso: string) {
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const start = new Date(startIso).toLocaleTimeString(DISPLAY_LOCALE, options);
  const end = new Date(endIso).toLocaleTimeString(DISPLAY_LOCALE, options);
  return `${start} – ${end}`;
}

export function formatFullDateTime(iso: string) {
  return new Date(iso).toLocaleString(DISPLAY_LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

export function formatWeekdayShort(date: Date) {
  return date.toLocaleDateString(DISPLAY_LOCALE, { weekday: "short" });
}

export function formatMinutesOfDay(minutes: number) {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${pad(minute)} ${period}`;
}

/** "HH:mm" (24h) for <input type="time"> values. */
export function minutesToTimeInputValue(minutes: number) {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}

export function timeInputValueToMinutes(value: string) {
  const [hourStr, minuteStr] = value.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}
