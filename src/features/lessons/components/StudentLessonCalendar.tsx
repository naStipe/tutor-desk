"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatHourLabel,
  formatMinutesOfDay,
  formatWeekdayShort,
  isSameDay,
  minutesSinceMidnightInZone,
  startOfDay,
  toDateParam,
} from "../date-utils";
import type { CalendarLesson } from "./LessonCalendar";

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 21;
const PX_PER_HOUR = 44;
const GUTTER_PX = 52;
const GRID_MAX_HEIGHT_PX = 560;

const STATUS_BLOCK_CLASSES: Record<string, string> = {
  scheduled: "bg-cyan text-on-cyan",
  completed: "bg-brand text-on-brand",
  cancelled: "bg-surface-muted text-ink-muted line-through",
  no_show: "bg-warning text-on-warning",
};

/** Read-only day/week grid for the student-view preview — same look as LessonCalendar, no drag/create. */
export function StudentLessonCalendar({
  dayStartValues,
  lessons,
  homeworkDueCountByDate,
  homeworkAwaitingFeedbackCountByDate,
  timeZone,
  locale,
  workingHoursStartMinutes,
  workingHoursEndMinutes,
}: {
  dayStartValues: string[];
  lessons: CalendarLesson[];
  homeworkDueCountByDate?: Record<string, number>;
  homeworkAwaitingFeedbackCountByDate?: Record<string, number>;
  timeZone?: string;
  locale?: string;
  workingHoursStartMinutes?: number;
  workingHoursEndMinutes?: number;
}) {
  const days = useMemo(() => dayStartValues.map((value) => new Date(value)), [dayStartValues]);

  // The grid always covers the default window, but expands to fit any lesson that falls
  // outside it instead of clipping/hiding it.
  const { startHour: START_HOUR, endHour: END_HOUR } = useMemo(() => {
    const defaultStartHour =
      workingHoursStartMinutes !== undefined
        ? Math.floor(workingHoursStartMinutes / 60)
        : DEFAULT_START_HOUR;
    const defaultEndHour =
      workingHoursEndMinutes !== undefined
        ? Math.ceil(workingHoursEndMinutes / 60)
        : DEFAULT_END_HOUR;
    let earliestHour = defaultStartHour;
    let latestHour = defaultEndHour;
    for (const lesson of lessons) {
      const start = minutesSinceMidnightInZone(new Date(lesson.startTime), timeZone) / 60;
      const end = minutesSinceMidnightInZone(new Date(lesson.endTime), timeZone) / 60;
      earliestHour = Math.min(earliestHour, Math.floor(start));
      latestHour = Math.max(latestHour, Math.ceil(end));
    }
    return { startHour: earliestHour, endHour: latestHour };
  }, [lessons, timeZone, workingHoursStartMinutes, workingHoursEndMinutes]);
  const GRID_HEIGHT = (END_HOUR - START_HOUR) * PX_PER_HOUR;
  const HOURS = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i),
    [START_HOUR, END_HOUR],
  );

  function clampMinutes(minutes: number) {
    return Math.min(Math.max(minutes, START_HOUR * 60), END_HOUR * 60);
  }

  // Refresh once a minute so the "now" line and today highlighting stay accurate in a
  // long-open session instead of freezing at whenever the calendar first mounted.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const isDayView = days.length === 1;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-surface shadow-sm shadow-black/[0.03] ${
        isDayView ? "max-w-md" : ""
      }`}
    >
      <div
        className="flex border-b border-border bg-surface-muted"
        style={{ paddingLeft: GUTTER_PX }}
      >
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          const isPast = startOfDay(day) < startOfDay(now);
          const dateParam = toDateParam(day);
          const dueCount = homeworkDueCountByDate?.[dateParam] ?? 0;
          const feedbackCount = homeworkAwaitingFeedbackCountByDate?.[dateParam] ?? 0;
          return (
            <div
              key={day.toISOString()}
              className={`flex-1 border-l border-border px-2 py-2.5 text-center first:border-l-0 ${
                isToday ? "bg-brand/10" : isPast ? "bg-surface-muted/50" : ""
              }`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wide ${isPast ? "text-ink-subtle/70" : "text-ink-subtle"}`}
              >
                {formatWeekdayShort(day, timeZone, locale)}
                {isPast && !isToday ? " · Past" : ""}
              </p>
              <p
                className={`mt-0.5 text-sm font-semibold ${
                  isToday ? "text-brand" : isPast ? "text-ink-subtle" : "text-ink"
                }`}
              >
                {day.getDate()}
              </p>
              {(dueCount > 0 || feedbackCount > 0) && (
                <p className="mt-1 flex items-center justify-center gap-1">
                  {dueCount > 0 && (
                    <span
                      title={`${dueCount} homework due`}
                      className="rounded-full bg-warning/20 px-1.5 text-[10px] font-medium leading-tight text-warning"
                    >
                      {dueCount}
                    </span>
                  )}
                  {feedbackCount > 0 && (
                    <span
                      title={`${feedbackCount} awaiting feedback`}
                      className="rounded-full bg-cyan/20 px-1.5 text-[10px] font-medium leading-tight text-cyan"
                    >
                      {feedbackCount}
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="flex overflow-x-auto overflow-y-auto"
        style={{ maxHeight: GRID_MAX_HEIGHT_PX }}
      >
        <div className="shrink-0 select-none" style={{ width: GUTTER_PX }}>
          {HOURS.map((hour) => (
            <div key={hour} className="relative text-right" style={{ height: PX_PER_HOUR }}>
              <span className="absolute -top-2 right-2 text-[11px] text-ink-subtle">
                {formatHourLabel(hour)}
              </span>
            </div>
          ))}
        </div>

        <div className="relative flex min-w-0 flex-1" style={{ height: GRID_HEIGHT }}>
          {HOURS.map((hour, index) => (
            <div
              key={hour}
              className="pointer-events-none absolute inset-x-0 border-t border-border"
              style={{ top: index * PX_PER_HOUR }}
            />
          ))}

          {days.map((day) => {
            const isToday = isSameDay(day, now);
            const isPastDay = startOfDay(day) < startOfDay(now);
            const nowLineTop =
              ((minutesSinceMidnightInZone(now, timeZone) - START_HOUR * 60) / 60) * PX_PER_HOUR;
            const pastOverlayHeight = isPastDay
              ? GRID_HEIGHT
              : isToday
                ? Math.min(Math.max(nowLineTop, 0), GRID_HEIGHT)
                : 0;
            const dayLessons = lessons.filter((lesson) =>
              isSameDay(new Date(lesson.startTime), day),
            );

            return (
              <div
                key={day.toISOString()}
                className={`relative flex-1 border-l border-border first:border-l-0 ${isToday ? "bg-brand/5" : ""}`}
              >
                {pastOverlayHeight > 0 && (
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-0 bg-surface-muted/50"
                    style={{ height: pastOverlayHeight }}
                  />
                )}

                {isToday && now.getHours() >= START_HOUR && now.getHours() < END_HOUR && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-danger"
                    style={{ top: nowLineTop }}
                  >
                    <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-danger" />
                  </div>
                )}

                {dayLessons.map((lesson) => {
                  const start = new Date(lesson.startTime);
                  const end = new Date(lesson.endTime);
                  const durationMinutes = Math.max(
                    15,
                    Math.round((end.getTime() - start.getTime()) / 60000),
                  );
                  const startMinutes = clampMinutes(minutesSinceMidnightInZone(start, timeZone));
                  const top = ((startMinutes - START_HOUR * 60) / 60) * PX_PER_HOUR;
                  const height = Math.max((durationMinutes / 60) * PX_PER_HOUR, 22);
                  const compact = height < 40;
                  const statusClass =
                    STATUS_BLOCK_CLASSES[lesson.status] ?? STATUS_BLOCK_CLASSES.scheduled;

                  return (
                    <div
                      key={lesson.id}
                      title={`${formatMinutesOfDay(startMinutes)} · ${lesson.studentName}`}
                      className={`absolute inset-x-1 z-20 overflow-hidden rounded-md px-2 text-left text-xs shadow-sm ${statusClass}`}
                      style={{ top, height }}
                    >
                      <span className="block truncate font-medium leading-tight">
                        {formatMinutesOfDay(startMinutes)} · {lesson.studentName}
                      </span>
                      {!compact && (
                        <span className="block truncate text-[11px] opacity-90">
                          {durationMinutes} min
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
