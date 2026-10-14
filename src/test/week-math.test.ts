import { describe, expect, it } from "vitest";
import { monthlyIncome, weeklyAdminHours } from "../features/marketing/week-math";

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
