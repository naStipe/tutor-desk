import { describe, expect, it } from "vitest";
import { lessonInputSchema } from "../features/lessons/schemas";

const studentId = "11111111-1111-4111-8111-111111111111";

describe("lesson input", () => {
  it("accepts a valid lesson with end after start", () => {
    const parsed = lessonInputSchema.parse({
      studentId,
      startTime: "2026-09-15T14:00:00.000Z",
      endTime: "2026-09-15T15:00:00.000Z",
      notes: "  Bring workbook  ",
    });
    expect(parsed.notes).toBe("Bring workbook");
  });

  it("rejects an end time at or before the start time", () => {
    expect(
      lessonInputSchema.safeParse({
        studentId,
        startTime: "2026-09-15T14:00:00.000Z",
        endTime: "2026-09-15T14:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid student id", () => {
    expect(
      lessonInputSchema.safeParse({
        studentId: "not-a-uuid",
        startTime: "2026-09-15T14:00:00.000Z",
        endTime: "2026-09-15T15:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects an unparsable date", () => {
    expect(
      lessonInputSchema.safeParse({
        studentId,
        startTime: "not-a-date",
        endTime: "2026-09-15T15:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});
