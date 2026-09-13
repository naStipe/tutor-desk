import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "../features/auth/schemas";

describe("tutor authentication input", () => {
  it("normalizes a valid tutor email", () => {
    expect(
      signUpSchema.parse({ email: " Tutor@Example.com ", password: "password123" }).email,
    ).toBe("tutor@example.com");
  });

  it("rejects weak signup passwords and empty login passwords", () => {
    expect(signUpSchema.safeParse({ email: "tutor@example.com", password: "short" }).success).toBe(
      false,
    );
    expect(signInSchema.safeParse({ email: "tutor@example.com", password: "" }).success).toBe(
      false,
    );
  });
});
