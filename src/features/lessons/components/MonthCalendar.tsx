"use client";

import {
  addDays,
  addMonths,
  dayRelativeToToday,
  firstDayOfWeek,
  formatMonthHeading,
  isSameDay,
  startOfMonth,
  startOfWeek,
  toDateParam,
  weekdayLabels,
} from "../date-utils";

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
  const weekStartsOn = firstDayOfWeek(locale);
  const weekdayHeaders = weekdayLabels(weekStartsOn, locale);
  const gridStart = startOfWeek(monthStart, weekStartsOn);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const now = new Date();

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

      <div className="grid grid-cols-7 gap-1 px-1 pb-1.5 text-center text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        {weekdayHeaders.map((label, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-entry header; labels can repeat in some locales
          <span key={index}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-1">
        {days.map((day) => {
          const dateParam = toDateParam(day);
          const inMonth = day.getMonth() === month.getMonth();
          const relativeToToday = dayRelativeToToday(dateParam, now, timeZone);
          const isToday = relativeToToday === "today";
          const isPast = relativeToToday === "past";
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
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onSelectDate(dateParam)}
              className={`relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition-all duration-150 sm:h-16 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${
                isSelected
                  ? "bg-brand font-semibold text-on-brand shadow-sm shadow-brand/30"
                  : isToday
                    ? "border border-brand/40 text-ink hover:bg-brand/5"
                    : isPast
                      ? "text-ink-subtle hover:bg-surface-muted"
                      : "text-ink hover:bg-surface-muted hover:scale-[1.03]"
              } ${!inMonth ? "text-ink-subtle/40" : ""} ${isDisabled ? "cursor-not-allowed opacity-30 hover:scale-100 active:scale-100" : ""}`}
            >
              <span>{day.getDate()}</span>
              {(count > 0 || homeworkCount > 0 || reviewCount > 0) && (
                <span className="flex items-center gap-0.5">
                  {count > 0 && (
                    <span
                      className={`rounded-full px-1 text-xs font-medium leading-tight ${
                        isSelected ? "bg-on-brand/20 text-on-brand" : "bg-brand/15 text-brand"
                      }`}
                    >
                      {count}
                      <span className="sr-only"> lessons</span>
                    </span>
                  )}
                  {homeworkCount > 0 && (
                    <span
                      className={`rounded-sm px-1 text-xs font-medium leading-tight ${
                        isSelected ? "bg-on-brand/20 text-on-brand" : "bg-warning/20 text-warning"
                      }`}
                      title={`${homeworkCount} ${homeworkDueLabel}`}
                    >
                      {homeworkCount}
                      <span className="sr-only"> {homeworkDueLabel}</span>
                    </span>
                  )}
                  {reviewCount > 0 && (
                    <span
                      className={`rounded-full px-1 text-xs font-medium leading-tight ring-1 ring-inset ${
                        isSelected
                          ? "bg-on-brand/20 text-on-brand ring-on-brand/50"
                          : "bg-cyan/20 text-cyan ring-cyan/50"
                      }`}
                      title={`${reviewCount} ${reviewLabel}`}
                    >
                      {reviewCount}
                      <span className="sr-only"> {reviewLabel}</span>
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
