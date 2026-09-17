"use client";

import { useMemo, useState } from "react";
import { inputClassName } from "../../../components/Field";
import { formatFullDateTime, parseDateParam, startOfDay, toDateParam } from "../date-utils";
import { MonthCalendar } from "./MonthCalendar";
import { TimeSlotGrid } from "./TimeSlotGrid";

const DURATION_PRESETS = [30, 45, 60, 90, 120];

export type PickerLesson = { id: string; startTime: string; endTime: string; status: string };

type LessonDateTimePickerProps = {
  lessons: PickerLesson[];
  excludeLessonId?: string;
  dateParam: string;
  minutes: number | null;
  durationMinutes: number;
  onChangeDate: (dateParam: string) => void;
  onChangeMinutes: (minutes: number) => void;
  onChangeDuration: (durationMinutes: number) => void;
  minDate?: Date;
  maxDate?: Date;
};

export function LessonDateTimePicker({
  lessons,
  excludeLessonId,
  dateParam,
  minutes,
  durationMinutes,
  onChangeDate,
  onChangeMinutes,
  onChangeDuration,
  minDate,
  maxDate,
}: LessonDateTimePickerProps) {
  // Counts (for the month view's per-day badges) include the lesson being edited, so its own
  // day still reads accurately; conflict-checking (for the time slots) excludes it so the lesson
  // doesn't block out its own current slot.
  const nonCancelledLessons = useMemo(
    () => lessons.filter((lesson) => lesson.status !== "cancelled"),
    [lessons],
  );
  const conflictLessons = useMemo(
    () => nonCancelledLessons.filter((lesson) => lesson.id !== excludeLessonId),
    [nonCancelledLessons, excludeLessonId],
  );

  const [month, setMonth] = useState(() => startOfDay(parseDateParam(dateParam)));

  const countByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lesson of nonCancelledLessons) {
      const key = toDateParam(new Date(lesson.startTime));
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [nonCancelledLessons]);

  const busyIntervals = useMemo(
    () =>
      conflictLessons
        .filter((lesson) => toDateParam(new Date(lesson.startTime)) === dateParam)
        .map((lesson) => ({
          start: new Date(lesson.startTime).getTime(),
          end: new Date(lesson.endTime).getTime(),
        })),
    [conflictLessons, dateParam],
  );

  function handleSelectDate(nextDateParam: string) {
    onChangeDate(nextDateParam);
    setMonth(startOfDay(parseDateParam(nextDateParam)));
  }

  const selectedSummary =
    minutes !== null
      ? formatFullDateTime(
          new Date(
            parseDateParam(dateParam).getFullYear(),
            parseDateParam(dateParam).getMonth(),
            parseDateParam(dateParam).getDate(),
            Math.floor(minutes / 60),
            minutes % 60,
          ).toISOString(),
        )
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChangeDuration(preset)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-[color,background-color,transform] duration-100 active:scale-95 motion-reduce:active:scale-100 ${
              durationMinutes === preset
                ? "border-brand bg-brand/10 text-brand"
                : "border-border text-ink-muted hover:bg-surface-muted"
            }`}
          >
            {preset} min
          </button>
        ))}
        <input
          type="number"
          min={5}
          max={600}
          step={5}
          value={durationMinutes}
          onChange={(event) => onChangeDuration(Number(event.target.value) || 0)}
          className={`${inputClassName} w-24`}
          aria-label="Custom duration in minutes"
        />
      </div>

      <div className="rounded-lg border border-border p-3">
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          selectedDate={dateParam}
          onSelectDate={handleSelectDate}
          countByDate={countByDate}
          minDate={minDate}
          maxDate={maxDate}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Available times</p>
        <TimeSlotGrid
          dateParam={dateParam}
          durationMinutes={durationMinutes}
          busyIntervals={busyIntervals}
          selectedMinutes={minutes}
          onSelect={onChangeMinutes}
        />
      </div>

      {selectedSummary && <p className="text-sm text-ink-muted">Scheduled for {selectedSummary}</p>}
    </div>
  );
}
