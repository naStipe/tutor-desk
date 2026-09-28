import { describe, expect, it } from "vitest";
import { findNextAvailableSlot } from "../features/lessons/date-utils";

const NOW = new Date(2026, 0, 1, 12, 0, 0); // Thursday, Jan 1 2026, local time

describe("findNextAvailableSlot", () => {
  it("defaults to tomorrow, same time-of-day as the source lesson, when it's free", () => {
    const sourceStart = new Date(2025, 11, 25, 15, 0, 0); // 3:00 PM
    const slot = findNextAvailableSlot({
      sourceStartIso: sourceStart.toISOString(),
      durationMinutes: 60,
      pickerLessons: [],
      workingHoursStartMinutes: 0,
      workingHoursEndMinutes: 24 * 60,
      now: NOW,
    });
    expect(slot).toEqual({ dateParam: "2026-01-02", minutes: 15 * 60 });
  });

  it("skips a day that already has an overlapping lesson at that time", () => {
    const sourceStart = new Date(2025, 11, 25, 15, 0, 0);
    const busyDay = new Date(2026, 0, 2, 15, 0, 0);
    const slot = findNextAvailableSlot({
      sourceStartIso: sourceStart.toISOString(),
      durationMinutes: 60,
      pickerLessons: [
        {
          id: "busy",
          startTime: busyDay.toISOString(),
          endTime: new Date(busyDay.getTime() + 60 * 60000).toISOString(),
          status: "scheduled",
        },
      ],
      workingHoursStartMinutes: 0,
      workingHoursEndMinutes: 24 * 60,
      now: NOW,
    });
    expect(slot).toEqual({ dateParam: "2026-01-03", minutes: 15 * 60 });
  });

  it("ignores a cancelled lesson when checking for conflicts", () => {
    const sourceStart = new Date(2025, 11, 25, 15, 0, 0);
    const busyDay = new Date(2026, 0, 2, 15, 0, 0);
    const slot = findNextAvailableSlot({
      sourceStartIso: sourceStart.toISOString(),
      durationMinutes: 60,
      pickerLessons: [
        {
          id: "cancelled",
          startTime: busyDay.toISOString(),
          endTime: new Date(busyDay.getTime() + 60 * 60000).toISOString(),
          status: "cancelled",
        },
      ],
      workingHoursStartMinutes: 0,
      workingHoursEndMinutes: 24 * 60,
      now: NOW,
    });
    expect(slot).toEqual({ dateParam: "2026-01-02", minutes: 15 * 60 });
  });

  it("ignores the excluded lesson id when checking for conflicts", () => {
    const sourceStart = new Date(2025, 11, 25, 15, 0, 0);
    const busyDay = new Date(2026, 0, 2, 15, 0, 0);
    const slot = findNextAvailableSlot({
      sourceStartIso: sourceStart.toISOString(),
      durationMinutes: 60,
      pickerLessons: [
        {
          id: "the-source-lesson",
          startTime: busyDay.toISOString(),
          endTime: new Date(busyDay.getTime() + 60 * 60000).toISOString(),
          status: "scheduled",
        },
      ],
      excludeLessonId: "the-source-lesson",
      workingHoursStartMinutes: 0,
      workingHoursEndMinutes: 24 * 60,
      now: NOW,
    });
    expect(slot).toEqual({ dateParam: "2026-01-02", minutes: 15 * 60 });
  });

  it("falls back to tomorrow, unchecked, when the source time no longer fits working hours", () => {
    const sourceStart = new Date(2025, 11, 25, 6, 0, 0); // 6:00 AM
    const slot = findNextAvailableSlot({
      sourceStartIso: sourceStart.toISOString(),
      durationMinutes: 60,
      pickerLessons: [],
      workingHoursStartMinutes: 9 * 60,
      workingHoursEndMinutes: 17 * 60,
      now: NOW,
    });
    expect(slot).toEqual({ dateParam: "2026-01-02", minutes: 6 * 60 });
  });
});
