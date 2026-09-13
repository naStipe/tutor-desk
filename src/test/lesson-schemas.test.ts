import { describe, expect, it } from "vitest";
import { lessonInputSchema, recurrenceInputSchema } from "../features/lessons/schemas";

const studentId = "11111111-1111-4111-8111-111111111111";
const subjectId = "22222222-2222-4222-8222-222222222222";

describe("lesson input", () => {
  it("accepts a valid lesson and defaults duration to 60 minutes", () => {
    const parsed = lessonInputSchema.parse({
      studentId,
      startTime: "2026-09-15T14:00:00.000Z",
      notes: "  Bring workbook  ",
    });
    expect(parsed.notes).toBe("Bring workbook");
    expect(parsed.durationMinutes).toBe(60);
    expect(parsed.paymentStatus).toBe("unpaid");
  });

  it("accepts an explicit subject, duration, price, currency and payment method", () => {
    const parsed = lessonInputSchema.parse({
      studentId,
      subjectId,
      startTime: "2026-09-15T14:00:00.000Z",
      durationMinutes: "90",
      price: "1500",
      currency: "RUB",
      paymentStatus: "paid",
      paymentMethod: "sbp",
    });
    expect(parsed.subjectId).toBe(subjectId);
    expect(parsed.durationMinutes).toBe(90);
    expect(parsed.price).toBe(1500);
    expect(parsed.paymentMethod).toBe("sbp");
  });

  it("rejects a duration that's too short", () => {
    expect(
      lessonInputSchema.safeParse({
        studentId,
        startTime: "2026-09-15T14:00:00.000Z",
        durationMinutes: "1",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid student id", () => {
    expect(
      lessonInputSchema.safeParse({
        studentId: "not-a-uuid",
        startTime: "2026-09-15T14:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects an unparsable date", () => {
    expect(
      lessonInputSchema.safeParse({
        studentId,
        startTime: "not-a-date",
      }).success,
    ).toBe(false);
  });

  it("accepts null for absent optional fields (FormData.get returns null, not undefined)", () => {
    const parsed = lessonInputSchema.parse({
      studentId,
      subjectId: null,
      startTime: "2026-09-15T14:00:00.000Z",
      durationMinutes: "60",
      price: null,
      currency: null,
      paymentMethod: null,
    });
    expect(parsed.subjectId).toBeUndefined();
    expect(parsed.paymentMethod).toBeUndefined();
  });
});

describe("recurrence input", () => {
  it("treats a checkbox 'on' value as repeat: true", () => {
    const parsed = recurrenceInputSchema.parse({ repeat: "on", repeatUntil: "" });
    expect(parsed.repeat).toBe(true);
    expect(parsed.repeatUntil).toBeUndefined();
  });

  it("treats a missing checkbox as repeat: false", () => {
    const parsed = recurrenceInputSchema.parse({ repeat: null, repeatUntil: "" });
    expect(parsed.repeat).toBe(false);
  });

  it("rejects an invalid repeatUntil date", () => {
    expect(
      recurrenceInputSchema.safeParse({ repeat: "on", repeatUntil: "not-a-date" }).success,
    ).toBe(false);
  });

  it("accepts null repeatUntil (the field isn't rendered when repeat is unchecked)", () => {
    const parsed = recurrenceInputSchema.parse({ repeat: null, repeatUntil: null });
    expect(parsed.repeat).toBe(false);
    expect(parsed.repeatUntil).toBeUndefined();
  });
});
