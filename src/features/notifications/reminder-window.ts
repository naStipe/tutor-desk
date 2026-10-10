/**
 * A lesson is reminded when its start falls in (now, now + 24h]. Consecutive runs of ANY
 * frequency at or below 24h therefore cover every lesson: with a daily schedule the windows tile
 * exactly (each lesson is caught by one run, between 0 and 24h before it starts); with an hourly
 * schedule the first run after the lesson enters the window catches it (about 24h before). The
 * sent log (unique per lesson) guarantees at most one reminder either way. A schedule slower
 * than 24h would leave gaps, so do not configure one.
 */
export const REMINDER_WINDOW_HOURS = 24;

/** Maximum emails attempted in one cron run; the remainder is picked up by the next run. */
export const MAX_REMINDERS_PER_RUN = 40;

export function getReminderWindow(now: Date) {
  return {
    from: now,
    to: new Date(now.getTime() + REMINDER_WINDOW_HOURS * 3_600_000),
  };
}
