const DEFAULT_LOCALE = "en-US";

/** No per-tutor setting for this yet; a fixed target keeps the goal progress bar meaningful. */
export const WEEKLY_GOAL_HOURS = 6;

export function formatEyebrowDate(date: Date, locale = DEFAULT_LOCALE) {
  const weekday = date.toLocaleDateString(locale, { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString(locale, { month: "long" });
  return `${weekday} · ${day} ${month}`;
}

export function greetingWord(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function formatDuration(totalMinutes: number) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function formatCountdown(now: Date, start: Date, end: Date) {
  if (now < start) {
    const minutes = Math.round((start.getTime() - now.getTime()) / 60000);
    if (minutes <= 0) return "starting now";
    return `in ${formatDuration(minutes)}`;
  }
  if (now < end) {
    const minutes = Math.max(1, Math.round((end.getTime() - now.getTime()) / 60000));
    return `ends in ${formatDuration(minutes)}`;
  }
  return "just ended";
}

export function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "2h ago", "yesterday", "3 days ago" — for a moment that already happened. */
export function formatRelativePast(now: Date, iso: string) {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (isSameCalendarDay(now, then)) return `${hours}h ago`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameCalendarDay(yesterday, then)) return "yesterday";
  const days = Math.floor(hours / 24) + 1;
  return `${days} days ago`;
}

/** "1 day overdue", "3 days overdue" — for a due date already in the past. */
export function formatOverdue(now: Date, iso: string) {
  const due = new Date(iso);
  const days = Math.max(1, Math.ceil((now.getTime() - due.getTime()) / 86400000));
  return days === 1 ? "1 day overdue" : `${days} days overdue`;
}
