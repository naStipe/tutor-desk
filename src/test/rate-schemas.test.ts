import { describe, expect, it } from "vitest";
import { rateInputSchema } from "../features/rates/schemas";

const studentId = "11111111-1111-4111-8111-111111111111";
const subjectId = "22222222-2222-4222-8222-222222222222";

describe("rate input", () => {
  it("accepts a valid rate and coerces the hourly rate to a number", () => {
    const parsed = rateInputSchema.parse({
      studentId,
      subjectId,
      hourlyRate: "1500",
      currency: "RUB",
    });
    expect(parsed.hourlyRate).toBe(1500);
    expect(parsed.currency).toBe("RUB");
  });

  it("rejects a zero or negative hourly rate", () => {
    expect(
      rateInputSchema.safeParse({ studentId, subjectId, hourlyRate: "0", currency: "RUB" }).success,
    ).toBe(false);
    expect(
      rateInputSchema.safeParse({ studentId, subjectId, hourlyRate: "-5", currency: "RUB" })
        .success,
    ).toBe(false);
  });

  it("rejects a currency outside the supported list", () => {
    expect(
      rateInputSchema.safeParse({ studentId, subjectId, hourlyRate: "10", currency: "USD" })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid student or subject id", () => {
    expect(
      rateInputSchema.safeParse({
        studentId: "not-a-uuid",
        subjectId,
        hourlyRate: "10",
        currency: "RUB",
      }).success,
    ).toBe(false);
  });
});
