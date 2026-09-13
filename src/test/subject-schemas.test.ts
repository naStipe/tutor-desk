import { describe, expect, it } from "vitest";
import { subjectInputSchema } from "../features/subjects/schemas";

describe("subject input", () => {
  it("trims the name", () => {
    const parsed = subjectInputSchema.parse({ name: "  Mathematics  " });
    expect(parsed.name).toBe("Mathematics");
  });

  it("rejects a blank name", () => {
    expect(subjectInputSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a name that's too long", () => {
    expect(subjectInputSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });
});
