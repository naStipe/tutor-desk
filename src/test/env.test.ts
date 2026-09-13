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
