import { describe, it, expect } from "vitest";
import { validateEnv } from "../lib/env";

describe("Environment Validation", () => {
  it("should validate and apply defaults for valid configuration", () => {
    const validConfig = {
      NODE_ENV: "development",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "https://cmlvtnjoynffrznyelym.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test-value",
    };

    const validated = validateEnv(validConfig);
    expect(validated.NODE_ENV).toBe("development");
    expect(validated.NEXT_PUBLIC_SUPABASE_URL).toContain("cmlvtnjoynffrznyelym");
  });

  it("rejects a non-HTTPS Supabase URL", () => {
    const invalidConfig = {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "http://cmlvtnjoynffrznyelym.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test-value",
    };

    expect(() => validateEnv(invalidConfig)).toThrow(/Environment validation failed/);
  });

  it("accepts plain HTTP only for the local Supabase stack", () => {
    const base = {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test-value",
    };

    expect(
      validateEnv({ ...base, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" })
        .NEXT_PUBLIC_SUPABASE_URL,
    ).toBe("http://127.0.0.1:54321");
    expect(() =>
      validateEnv({ ...base, NEXT_PUBLIC_SUPABASE_URL: "http://localhost.evil.test" }),
    ).toThrow(/Environment validation failed/);
    expect(() =>
      validateEnv({ ...base, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1.evil.test" }),
    ).toThrow(/Environment validation failed/);
  });

  it("rejects a missing publishable key", () => {
    const missingKeyConfig = {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "https://cmlvtnjoynffrznyelym.supabase.co",
    };

    expect(() => validateEnv(missingKeyConfig)).toThrow(/Environment validation failed/);
  });

  it("rejects missing required configuration", () => {
    expect(() => validateEnv({})).toThrow(/Environment validation failed/);
  });
});
