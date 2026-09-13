import { describe, expect, it } from "vitest";
import { studentInputSchema } from "../features/students/schemas";

describe("student input", () => {
  it("trims name and normalizes blank optional fields to undefined", () => {
    const parsed = studentInputSchema.parse({ name: "  Alex Student  ", email: "  ", notes: "" });
    expect(parsed).toEqual({ name: "Alex Student" });
  });

  it("requires a non-empty name", () => {
    expect(studentInputSchema.safeParse({ name: "  " }).success).toBe(false);
  });

  it("rejects an invalid email when supplied", () => {
    expect(studentInputSchema.safeParse({ name: "Alex", email: "not-an-email" }).success).toBe(
      false,
    );
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
