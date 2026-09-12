import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "../features/auth/schemas";
import { auth } from "../lib/auth";

describe("TD-001A Auth Validation Schemas", () => {
  describe("signUpSchema", () => {
    it("accepts valid sign up data and normalizes email", () => {
      const result = signUpSchema.safeParse({
        name: "  Sarah Tutor  ",
        email: "SARAH@Example.COM",
        password: "SuperSecretPassword123!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Sarah Tutor");
        expect(result.data.email).toBe("sarah@example.com");
        expect(result.data.password).toBe("SuperSecretPassword123!");
      }
    });

    it("rejects empty or whitespace-only name", () => {
      const result = signUpSchema.safeParse({
        name: "   ",
        email: "sarah@example.com",
        password: "SuperSecretPassword123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Full name is required");
      }
    });

    it("rejects invalid email formats", () => {
      const result = signUpSchema.safeParse({
        name: "Sarah Tutor",
        email: "not-an-email",
        password: "SuperSecretPassword123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("valid email address");
      }
    });

    it("rejects passwords shorter than 8 characters", () => {
      const result = signUpSchema.safeParse({
        name: "Sarah Tutor",
        email: "sarah@example.com",
        password: "short",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("at least 8 characters");
      }
    });

    it("rejects passwords exceeding 128 characters", () => {
      const result = signUpSchema.safeParse({
        name: "Sarah Tutor",
        email: "sarah@example.com",
        password: "a".repeat(129),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("not exceed 128 characters");
      }
    });
  });

  describe("signInSchema", () => {
    it("accepts valid sign in credentials", () => {
      const result = signInSchema.safeParse({
        email: "TUTOR@example.COM",
        password: "AnyValidPassword",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("tutor@example.com");
        expect(result.data.password).toBe("AnyValidPassword");
      }
    });

    it("rejects missing password", () => {
      const result = signInSchema.safeParse({
        email: "tutor@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("Password is required");
      }
    });
  });
});

describe("TD-001A Better Auth Server API Integration", () => {
  const testEmail = `tutor-${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";
  const testName = "Test Tutor Integration";

  it("registers a new tutor account and issues session token", async () => {
    const res = await auth.api.signUpEmail({
      body: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
    });

    expect(res).toBeDefined();
    expect(res.user.email).toBe(testEmail);
    expect(res.user.name).toBe(testName);
    expect(res.token).toBeDefined();
    expect(typeof res.token).toBe("string");
  });

  it("authenticates existing tutor credentials with signInEmail", async () => {
    const res = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: testPassword,
      },
    });

    expect(res).toBeDefined();
    expect(res.user.email).toBe(testEmail);
    expect(res.token).toBeDefined();
  });

  it("rejects incorrect credentials with an error", async () => {
    await expect(
      auth.api.signInEmail({
        body: {
          email: testEmail,
          password: "WrongPassword456!",
        },
      }),
    ).rejects.toThrow();
  });

  it("verifies and retrieves session via getSession with session cookie", async () => {
    const signInRes = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: testPassword,
      },
      asResponse: true,
    });

    const setCookie = signInRes.headers.get("set-cookie");
    expect(setCookie).toBeDefined();

    const sessionRes = await auth.api.getSession({
      headers: new Headers({
        cookie: setCookie || "",
      }),
    });

    expect(sessionRes).toBeDefined();
    expect(sessionRes?.user.email).toBe(testEmail);
    expect(sessionRes?.session).toBeDefined();
  });
});
