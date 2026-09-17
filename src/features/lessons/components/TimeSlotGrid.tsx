"use client";

import { useState } from "react";
import { combineDateAndMinutes, formatMinutesOfDay, minutesSinceMidnight } from "../date-utils";

const DEFAULT_START_MINUTES = 7 * 60;
const DEFAULT_END_MINUTES = 21 * 60;
const SLOT_STEP = 15;

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
  const [hoveredMinutes, setHoveredMinutes] = useState<number | null>(null);
  const now = new Date();
  const slots: { minutes: number; reason: SlotReason }[] = [];

  // Widen the default window instead of hiding times that fall outside it: the lesson
  // currently being edited/selected, and any already-booked lesson on this day, must stay
  // reachable even if they start before 7:00 or run past 21:00.
  const boundaryMinutes = [
    DEFAULT_START_MINUTES,
    DEFAULT_END_MINUTES,
    ...(selectedMinutes !== null ? [selectedMinutes, selectedMinutes + durationMinutes] : []),
    ...busyIntervals.flatMap((busy) => [
      minutesSinceMidnight(new Date(busy.start)),
      minutesSinceMidnight(new Date(busy.end)),
    ]),
  ];
  const startMinutesBound = Math.floor(Math.min(...boundaryMinutes) / SLOT_STEP) * SLOT_STEP;
  const endMinutesBound = Math.ceil(Math.max(...boundaryMinutes) / SLOT_STEP) * SLOT_STEP;

  for (
    let minutes = startMinutesBound;
    minutes + durationMinutes <= endMinutesBound;
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
      busyIntervals.some(
        (busy) => slotStart.getTime() < busy.end && slotEnd.getTime() > busy.start,
      );

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
      <p className="text-sm text-ink-subtle">This duration doesn't fit on the selected day.</p>
    );
  }

  const anchorMinutes = hoveredMinutes ?? selectedMinutes;
  const durationLabel =
    durationMinutes % 60 === 0 ? `${durationMinutes / 60}h` : `${durationMinutes}m`;

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-ink-subtle">
        Each lesson takes <span className="font-medium text-ink">{durationLabel}</span> — hover a
        time to preview the window it will occupy.
      </p>
      <div className="grid max-h-72 grid-cols-4 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-6">
        {slots.map((slot) => {
          const isSelected = selectedMinutes === slot.minutes;
          const isPrimaryHover = hoveredMinutes === slot.minutes;
          const inSpan =
            anchorMinutes !== null &&
            slot.minutes >= anchorMinutes &&
            slot.minutes < anchorMinutes + durationMinutes;

          return (
            <button
              key={slot.minutes}
              type="button"
              disabled={slot.reason !== "available"}
              onClick={() => onSelect(slot.minutes)}
              onMouseEnter={() => slot.reason === "available" && setHoveredMinutes(slot.minutes)}
              onMouseLeave={() => setHoveredMinutes(null)}
              onFocus={() => slot.reason === "available" && setHoveredMinutes(slot.minutes)}
              onBlur={() => setHoveredMinutes(null)}
              title={
                slot.reason === "occupied"
                  ? "A lesson is already scheduled at this time"
                  : slot.reason === "no-fit"
                    ? "Doesn't fit before the next lesson"
                    : undefined
              }
              className={`flex h-11 items-center justify-center rounded-md border px-2 text-center text-xs font-medium leading-tight transition-all duration-150 active:scale-95 motion-reduce:active:scale-100 ${
                isSelected
                  ? "border-brand bg-brand text-on-brand"
                  : slot.reason === "available"
                    ? "border-border bg-surface text-ink hover:bg-surface-muted"
                    : slot.reason === "occupied"
                      ? "cursor-not-allowed border-danger/30 bg-danger/10 text-danger"
                      : slot.reason === "no-fit"
                        ? "cursor-not-allowed border-warning/30 bg-warning/10 text-warning"
                        : "cursor-not-allowed border-border/60 bg-surface-muted text-ink-subtle line-through"
              } ${
                inSpan && !isSelected
                  ? isPrimaryHover
                    ? "ring-2 ring-brand ring-inset"
                    : "ring-2 ring-brand/40 ring-inset"
                  : ""
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
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm ring-2 ring-brand/40 ring-inset" />
          Lesson window
        </span>
      </div>
    </div>
  );
}
