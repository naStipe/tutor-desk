"use client";

import {
  addDays,
  addMonths,
  formatMonthHeading,
  isSameDay,
  startOfDay,
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
  homeworkCountByDate?: Record<string, number>;
  homeworkDueLabel?: string;
  reviewCountByDate?: Record<string, number>;
  reviewLabel?: string;
  minDate?: Date;
  maxDate?: Date;
  timeZone?: string;
  locale?: string;
};

export function MonthCalendar({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  countByDate,
  homeworkCountByDate,
  homeworkDueLabel = "homework due",
  reviewCountByDate,
  reviewLabel = "ready for review",
  minDate,
  maxDate,
  timeZone,
  locale,
}: MonthCalendarProps) {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = new Date();

  const canGoPrev = !minDate || addDays(startOfMonth(addMonths(month, -1)), 6) >= minDate;
  const canGoNext = !maxDate || startOfMonth(addMonths(month, 1)) <= maxDate;

  return (
    <div className="select-none">
      <div className="flex items-center justify-between px-1 pb-3">
        <button
          type="button"
          onClick={() => canGoPrev && onMonthChange(addMonths(month, -1))}
          disabled={!canGoPrev}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-[background-color,color,transform] duration-100 hover:bg-surface-muted hover:text-ink active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100 motion-reduce:active:scale-100"
          aria-label="Previous month"
        >
          &larr;
        </button>
        <p className="text-sm font-semibold tracking-wide text-ink">
          {formatMonthHeading(month, timeZone, locale)}
        </p>
        <button
          type="button"
          onClick={() => canGoNext && onMonthChange(addMonths(month, 1))}
          disabled={!canGoNext}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-[background-color,color,transform] duration-100 hover:bg-surface-muted hover:text-ink active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100 motion-reduce:active:scale-100"
          aria-label="Next month"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1 pb-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-1">
        {days.map((day) => {
          const dateParam = toDateParam(day);
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = isSameDay(day, today);
          const isPast = startOfDay(day) < startOfDay(today) && !isToday;
          const isSelected = selectedDate === dateParam;
          const isDisabled =
            (minDate && day < minDate && !isSameDay(day, minDate)) ||
            (maxDate && day > maxDate && !isSameDay(day, maxDate));
          const count = countByDate[dateParam] ?? 0;
          const homeworkCount = homeworkCountByDate?.[dateParam] ?? 0;
          const reviewCount = reviewCountByDate?.[dateParam] ?? 0;

          return (
            <button
              key={dateParam}
              type="button"
              disabled={Boolean(isDisabled)}
              onClick={() => onSelectDate(dateParam)}
              className={`relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition-all duration-150 sm:h-16 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${
                isSelected
                  ? "bg-brand font-semibold text-on-brand shadow-sm shadow-brand/30"
                  : isToday
                    ? "border border-brand/40 text-ink hover:bg-brand/5"
                    : isPast
                      ? "text-ink-subtle/70 hover:bg-surface-muted"
                      : "text-ink hover:bg-surface-muted hover:scale-[1.03]"
              } ${!inMonth ? "text-ink-subtle/40" : ""} ${isDisabled ? "cursor-not-allowed opacity-30 hover:scale-100 active:scale-100" : ""}`}
            >
              <span>{day.getDate()}</span>
              {(count > 0 || homeworkCount > 0 || reviewCount > 0) && (
                <span className="flex items-center gap-1">
                  {count > 0 && (
                    <span
                      className={`rounded-full px-1.5 text-[10px] font-medium leading-tight ${
                        isSelected ? "bg-on-brand/20 text-on-brand" : "bg-brand/15 text-brand"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {homeworkCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 text-[10px] font-medium leading-tight ${
                        isSelected ? "bg-on-brand/20 text-on-brand" : "bg-warning/20 text-warning"
                      }`}
                      title={`${homeworkCount} ${homeworkDueLabel}`}
                    >
                      {homeworkCount}
                    </span>
                  )}
                  {reviewCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 text-[10px] font-medium leading-tight ${
                        isSelected ? "bg-on-brand/20 text-on-brand" : "bg-cyan/20 text-cyan"
                      }`}
                      title={`${reviewCount} ${reviewLabel}`}
                    >
                      {reviewCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
