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

type SlotReason = "available" | "past" | "occupied" | "no-fit";

export function TimeSlotGrid({
  dateParam,
  durationMinutes,
  busyIntervals,
  selectedMinutes,
  onSelect,
}: TimeSlotGridProps) {
  const now = new Date();
  const slots: { minutes: number; reason: SlotReason }[] = [];

  for (
    let minutes = START_MINUTES;
    minutes + durationMinutes <= END_MINUTES;
    minutes += SLOT_STEP
  ) {
    const slotStart = combineDateAndMinutes(dateParam, minutes);
    const slotEnd = combineDateAndMinutes(dateParam, minutes + durationMinutes);
    const isPast = slotStart < now;
    // "occupied": a lesson is already happening at the slot's start time.
    // "no-fit": the slot starts free, but the requested duration runs into a later lesson.
    const occupied = busyIntervals.some(
      (busy) => slotStart.getTime() < busy.end && slotStart.getTime() >= busy.start,
    );
    const noFit =
      !occupied &&
      busyIntervals.some((busy) => slotStart.getTime() < busy.end && slotEnd.getTime() > busy.start);

    const reason: SlotReason = isPast
      ? "past"
      : occupied
        ? "occupied"
        : noFit
          ? "no-fit"
          : "available";
    slots.push({ minutes, reason });
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-ink-subtle">
        This duration doesn't fit within the 7:00–21:00 scheduling window.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {slots.map((slot) => {
          const isSelected = selectedMinutes === slot.minutes;
          return (
            <button
              key={slot.minutes}
              type="button"
              disabled={slot.reason !== "available"}
              onClick={() => onSelect(slot.minutes)}
              title={
                slot.reason === "occupied"
                  ? "A lesson is already scheduled at this time"
                  : slot.reason === "no-fit"
                    ? "Doesn't fit before the next lesson"
                    : undefined
              }
              className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-brand bg-brand text-on-brand"
                  : slot.reason === "available"
                    ? "border-border bg-surface text-ink hover:bg-surface-muted"
                    : slot.reason === "occupied"
                      ? "cursor-not-allowed border-danger/30 bg-danger/10 text-danger"
                      : slot.reason === "no-fit"
                        ? "cursor-not-allowed border-warning/30 bg-warning/10 text-warning"
                        : "cursor-not-allowed border-border/60 bg-surface-muted text-ink-subtle line-through"
              }`}
            >
              {formatMinutesOfDay(slot.minutes)}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-subtle">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-danger/30 bg-danger/10" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-warning/30 bg-warning/10" />
          Too close to next lesson
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-border/60 bg-surface-muted" />
          Past
        </span>
      </div>
    </div>
  );
}
