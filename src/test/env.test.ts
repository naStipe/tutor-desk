import { describe, it, expect } from "vitest";
import { validateEnv, envSchema } from "../lib/env";

describe("Environment Validation", () => {
  it("should validate and apply defaults for valid configuration", () => {
    const validConfig = {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/tutordesk",
      BETTER_AUTH_SECRET: "minimum-sixteen-chars-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
    };

    const validated = validateEnv(validConfig);
    expect(validated.NODE_ENV).toBe("development");
    expect(validated.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(validated.DATABASE_URL).toBe(
      "postgresql://postgres:postgres@localhost:5432/tutordesk"
    );
  });

  it("should reject invalid URLs for NEXT_PUBLIC_APP_URL", () => {
    const invalidConfig = {
      NEXT_PUBLIC_APP_URL: "not-a-valid-url",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/tutordesk",
      BETTER_AUTH_SECRET: "minimum-sixteen-chars-secret",
    };

    expect(() => validateEnv(invalidConfig)).toThrow(
      /Environment validation failed/
    );
  });

  it("should reject secrets shorter than 16 characters", () => {
    const shortSecretConfig = {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/tutordesk",
      BETTER_AUTH_SECRET: "too-short",
    };

    expect(() => validateEnv(shortSecretConfig)).toThrow(
      /Environment validation failed/
    );
  });
});
