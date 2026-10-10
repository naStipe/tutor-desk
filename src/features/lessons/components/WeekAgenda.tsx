"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatTimeRange,
  formatWeekdayShort,
  isSameDay,
  toDateParam,
  toDateParamInZone,
} from "../date-utils";
import type { AgendaLesson } from "./ScheduleAgenda";
import { PaymentBadge } from "./PaymentBadge";
import { StatusBadge } from "./StatusBadge";

/**
 * Phone replacement for the 7-column week grid. Seven columns on a ~375px screen leave each day
 * ~40px wide, which cannot show a student's name, so a week is shown as a day-by-day list instead.
 * Tapping a day heading opens that day's full time grid.
 */
export function WeekAgenda({
  dayStartValues,
  lessons,
  timeZone,
  locale,
}: {
  dayStartValues: string[];
  lessons: AgendaLesson[];
  timeZone?: string;
  locale?: string;
}) {
  const [now] = useState(() => new Date());
  const days = dayStartValues.map((value) => new Date(value));

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const dateParam = toDateParam(day);
        const isToday = isSameDay(day, now);
        const dayLessons = lessons
          .filter((lesson) => toDateParamInZone(new Date(lesson.startTime), timeZone) === dateParam)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return (
          <section key={dateParam} aria-label={dateParam}>
            <Link
              href={`/dashboard/schedule?view=day&date=${dateParam}`}
              className="flex min-h-11 items-center justify-between gap-3 px-1"
            >
              <span className="flex items-baseline gap-2">
                <span className={`text-sm font-semibold ${isToday ? "text-brand" : "text-ink"}`}>
                  {formatWeekdayShort(day, timeZone, locale)} {day.getDate()}
                </span>
                {isToday && (
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-medium text-brand">
                    Today
                  </span>
                )}
              </span>
              <span className="text-xs text-ink-subtle">
                {dayLessons.length === 0
                  ? "Free"
                  : `${dayLessons.length} lesson${dayLessons.length === 1 ? "" : "s"} · open day →`}
              </span>
            </Link>

            {dayLessons.length > 0 && (
              <ul className="space-y-2">
                {dayLessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={`/dashboard/lessons/${lesson.id}`}
                      className={`flex items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3 shadow-sm shadow-black/[0.03] active:bg-surface-muted ${
                        isToday ? "border-brand/40" : "border-border"
                      } ${lesson.status === "cancelled" ? "opacity-70" : ""}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">
                          {formatTimeRange(lesson.startTime, lesson.endTime, timeZone, locale)}
                        </p>
                        <p
                          className={`mt-0.5 truncate text-sm text-ink-muted ${lesson.status === "cancelled" ? "line-through" : ""}`}
                        >
                          {lesson.studentName}
                          {lesson.subjectName ? ` · ${lesson.subjectName}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={lesson.status} />
                        <PaymentBadge status={lesson.paymentStatus} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
