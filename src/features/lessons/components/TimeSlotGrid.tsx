"use client";

import { combineDateAndMinutes, formatMinutesOfDay } from "../date-utils";

const START_MINUTES = 7 * 60;
const END_MINUTES = 21 * 60;
const SLOT_STEP = 30;

type Interval = { start: number; end: number };

type TimeSlotGridProps = {
  dateParam: string;
  durationMinutes: number;
  busyIntervals: Interval[];
  selectedMinutes: number | null;
  onSelect: (minutes: number) => void;
};

export function TimeSlotGrid({
  dateParam,
  durationMinutes,
  busyIntervals,
  selectedMinutes,
  onSelect,
}: TimeSlotGridProps) {
  const now = new Date();
  const slots: { minutes: number; available: boolean }[] = [];

  for (
    let minutes = START_MINUTES;
    minutes + durationMinutes <= END_MINUTES;
    minutes += SLOT_STEP
  ) {
    const slotStart = combineDateAndMinutes(dateParam, minutes);
    const slotEnd = combineDateAndMinutes(dateParam, minutes + durationMinutes);
    const isPast = slotStart < now;
    const conflicts = busyIntervals.some(
      (busy) => slotStart.getTime() < busy.end && slotEnd.getTime() > busy.start,
    );
    slots.push({ minutes, available: !isPast && !conflicts });
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-ink-subtle">
        This duration doesn't fit within the 7:00–21:00 scheduling window.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
      {slots.map((slot) => {
        const isSelected = selectedMinutes === slot.minutes;
        return (
          <button
            key={slot.minutes}
            type="button"
            disabled={!slot.available}
            onClick={() => onSelect(slot.minutes)}
            className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
              isSelected
                ? "border-brand bg-brand text-on-brand"
                : slot.available
                  ? "border-border bg-surface text-ink hover:bg-surface-muted"
                  : "border-border/60 bg-surface-muted text-ink-subtle line-through cursor-not-allowed"
            }`}
          >
            {formatMinutesOfDay(slot.minutes)}
          </button>
        );
      })}
    </div>
  );
}
