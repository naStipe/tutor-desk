import { describe, expect, it } from "vitest";
import { studentInputSchema } from "../features/students/schemas";

describe("student input", () => {
  it("trims name and normalizes blank optional fields to undefined", () => {
    const parsed = studentInputSchema.parse({
      name: "  Alex Student  ",
      email: "  ",
      phone: "",
      telegram: "",
      notes: "",
    });
    expect(parsed).toEqual({ name: "Alex Student", defaultCurrency: "RUB" });
  });

  it("requires only a non-empty name", () => {
    expect(studentInputSchema.safeParse({ name: "Alex" }).success).toBe(true);
    expect(studentInputSchema.safeParse({ name: "  " }).success).toBe(false);
  });

  it("rejects an invalid email when supplied", () => {
    expect(studentInputSchema.safeParse({ name: "Alex", email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("accepts a student with only a phone number", () => {
    const parsed = studentInputSchema.parse({ name: "Alex", phone: "  555-0100  " });
    expect(parsed.phone).toBe("555-0100");
  });

  it("accepts a student with only a Telegram handle", () => {
    const parsed = studentInputSchema.parse({ name: "Alex", telegram: "  @alex_student  " });
    expect(parsed.telegram).toBe("@alex_student");
  });

  it("accepts a valid email and notes", () => {
    const parsed = studentInputSchema.parse({
      name: "Alex",
      email: "  Parent@Example.com ",
      notes: "  Prefers evening lessons  ",
    });
    expect(parsed.email).toBe("parent@example.com");
    expect(parsed.notes).toBe("Prefers evening lessons");
  });
});
