"use client";

import {
  addDays,
  addMonths,
  formatMonthHeading,
  isSameDay,
  startOfMonth,
  startOfWeek,
  toDateParam,
} from "../date-utils";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

type MonthCalendarProps = {
  month: Date;
  onMonthChange: (month: Date) => void;
  selectedDate: string | null;
  onSelectDate: (dateParam: string) => void;
  countByDate: Record<string, number>;
  minDate?: Date;
  maxDate?: Date;
};

export function MonthCalendar({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  countByDate,
  minDate,
  maxDate,
}: MonthCalendarProps) {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = new Date();

  const canGoPrev = !minDate || addDays(startOfMonth(addMonths(month, -1)), 6) >= minDate;
  const canGoNext = !maxDate || startOfMonth(addMonths(month, 1)) <= maxDate;

  return (
    <div>
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={() => canGoPrev && onMonthChange(addMonths(month, -1))}
          disabled={!canGoPrev}
          className="rounded-md p-1.5 text-ink-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous month"
        >
          &larr;
        </button>
        <p className="text-sm font-semibold text-ink">{formatMonthHeading(month)}</p>
        <button
          type="button"
          onClick={() => canGoNext && onMonthChange(addMonths(month, 1))}
          disabled={!canGoNext}
          className="rounded-md p-1.5 text-ink-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next month"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1 pb-1 text-center text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-1">
        {days.map((day) => {
          const dateParam = toDateParam(day);
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate === dateParam;
          const isDisabled =
            (minDate && day < minDate && !isSameDay(day, minDate)) ||
            (maxDate && day > maxDate && !isSameDay(day, maxDate));
          const count = countByDate[dateParam] ?? 0;

          return (
            <button
              key={dateParam}
              type="button"
              disabled={Boolean(isDisabled)}
              onClick={() => onSelectDate(dateParam)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-brand text-on-brand font-semibold"
                  : isToday
                    ? "border border-brand/40 text-ink"
                    : "text-ink hover:bg-surface-muted"
              } ${!inMonth ? "text-ink-subtle/50" : ""} ${isDisabled ? "cursor-not-allowed opacity-30" : ""}`}
            >
              <span>{day.getDate()}</span>
              {count > 0 && (
                <span
                  className={`mt-0.5 rounded-full px-1 text-[10px] leading-tight ${
                    isSelected ? "bg-on-brand/20 text-on-brand" : "bg-brand/15 text-brand"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
