import { describe, expect, it } from "vitest";
import {
  formatDuration,
  monthlyAdminHours,
  monthlyIncome,
  weeklyAdminHours,
  weeklyAdminMinutes,
} from "../features/marketing/week-math";

describe("landing week maths", () => {
  it("scales weekly lessons to a month", () => {
    expect(monthlyIncome({ lessonsPerWeek: 12, ratePerLesson: 40, adminMinutes: 10 })).toBe(2078);
  });

  it("returns zero for an empty week", () => {
    const empty = { lessonsPerWeek: 0, ratePerLesson: 40, adminMinutes: 10 };
    expect(monthlyIncome(empty)).toBe(0);
    expect(weeklyAdminHours(empty)).toBe(0);
  });

  it("rounds admin hours to one decimal", () => {
    expect(weeklyAdminHours({ lessonsPerWeek: 12, ratePerLesson: 40, adminMinutes: 10 })).toBe(2);
    expect(weeklyAdminHours({ lessonsPerWeek: 7, ratePerLesson: 40, adminMinutes: 10 })).toBe(1.2);
  });
});

describe("landing admin time", () => {
  const input = { lessonsPerWeek: 12, ratePerLesson: 40, adminMinutes: 10 };

  it("scales weekly admin to a month", () => {
    expect(weeklyAdminMinutes(input)).toBe(120);
    expect(monthlyAdminHours(input)).toBe(9);
  });

  it("formats short and long durations", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(2)).toBe("2 min");
    expect(formatDuration(72)).toBe("1.2 h");
    expect(formatDuration(120)).toBe("2 h");
  });
});
