import { describe, it, expect } from "vitest";
import { validateEnv } from "../lib/env";

describe("Environment Validation", () => {
  it("should validate and apply defaults for valid configuration", () => {
    const validConfig = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://tutordesk:local@localhost:5432/tutordesk",
      BETTER_AUTH_SECRET: "a-development-secret-with-32-characters",
      BETTER_AUTH_URL: "http://localhost:3000",
    };

    const validated = validateEnv(validConfig);
    expect(validated.NODE_ENV).toBe("development");
    expect(validated.DATABASE_URL).toBe("postgresql://tutordesk:local@localhost:5432/tutordesk");
  });

  it("rejects a non-PostgreSQL database URL", () => {
    const invalidConfig = {
      DATABASE_URL: "https://localhost:5432/tutordesk",
      BETTER_AUTH_SECRET: "a-development-secret-with-32-characters",
      BETTER_AUTH_URL: "http://localhost:3000",
    };

    expect(() => validateEnv(invalidConfig)).toThrow(/Environment validation failed/);
  });

  it("rejects secrets shorter than 32 characters", () => {
    const shortSecretConfig = {
      DATABASE_URL: "postgresql://tutordesk:local@localhost:5432/tutordesk",
      BETTER_AUTH_SECRET: "short-development-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
    };

    expect(() => validateEnv(shortSecretConfig)).toThrow(/Environment validation failed/);
  });

  it("rejects missing required configuration", () => {
    expect(() => validateEnv({})).toThrow(/Environment validation failed/);
  });
});
