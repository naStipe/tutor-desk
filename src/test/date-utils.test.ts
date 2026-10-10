import { describe, expect, it } from "vitest";
import {
  dayRelativeToToday,
  findNextAvailableSlot,
  firstDayOfWeek,
  startOfWeek,
  toDateParam,
  weekdayLabels,
} from "../features/lessons/date-utils";

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

describe("firstDayOfWeek", () => {
  it("falls back to Monday for a missing or invalid locale", () => {
    expect(firstDayOfWeek(undefined)).toBe(1);
    expect(firstDayOfWeek("not a locale!!")).toBe(1);
  });

  it("returns a Date#getDay-style number (0-6)", () => {
    for (const locale of ["en-US", "en-GB", "ru-RU", "de-DE", "ar-EG"]) {
      const day = firstDayOfWeek(locale);
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(6);
    }
  });

  it("uses week info when the runtime supports it", () => {
    const probe = new Intl.Locale("en-US") as Intl.Locale & {
      getWeekInfo?: unknown;
      weekInfo?: unknown;
    };
    if (!probe.getWeekInfo && !probe.weekInfo) return;
    expect(firstDayOfWeek("en-US")).toBe(0);
    expect(firstDayOfWeek("en-GB")).toBe(1);
    expect(firstDayOfWeek("ar-EG")).toBe(6);
  });
});

describe("startOfWeek / weekdayLabels", () => {
  const wednesday = new Date(2026, 0, 7, 15, 30);

  it("defaults to Monday and honours another first day", () => {
    expect(toDateParam(startOfWeek(wednesday))).toBe("2026-01-05");
    expect(toDateParam(startOfWeek(wednesday, 0))).toBe("2026-01-04");
    expect(toDateParam(startOfWeek(wednesday, 6))).toBe("2026-01-03");
    expect(toDateParam(startOfWeek(new Date(2026, 0, 4), 0))).toBe("2026-01-04");
    expect(toDateParam(startOfWeek(new Date(2026, 0, 4), 1))).toBe("2025-12-29");
  });

  it("orders weekday labels from the first day", () => {
    expect(weekdayLabels(1, "en-US").slice(0, 2)).toEqual(["Mon", "Tue"]);
    expect(weekdayLabels(0, "en-US").slice(0, 2)).toEqual(["Sun", "Mon"]);
    expect(weekdayLabels(0, "en-US")).toHaveLength(7);
  });

  it("falls back for an invalid locale instead of throwing", () => {
    expect(weekdayLabels(1, "not a locale!!")[0]).toBe("Mon");
  });
});

describe("dayRelativeToToday", () => {
  // 2026-01-01 23:30 UTC is already Jan 2 in Auckland and still Jan 1 in New York.
  const now = new Date(Date.UTC(2026, 0, 1, 23, 30));

  it("uses the given timezone, not the machine clock", () => {
    expect(dayRelativeToToday("2026-01-02", now, "Pacific/Auckland")).toBe("today");
    expect(dayRelativeToToday("2026-01-01", now, "Pacific/Auckland")).toBe("past");
    expect(dayRelativeToToday("2026-01-01", now, "America/New_York")).toBe("today");
    expect(dayRelativeToToday("2026-01-02", now, "America/New_York")).toBe("future");
  });

  it("falls back to the local day without a timezone", () => {
    const local = new Date(2026, 5, 15, 12, 0);
    expect(dayRelativeToToday("2026-06-15", local)).toBe("today");
    expect(dayRelativeToToday("2026-06-14", local)).toBe("past");
    expect(dayRelativeToToday("2026-06-16", local)).toBe("future");
  });
});
