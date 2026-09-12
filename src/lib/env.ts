import { z } from "zod";

/**
 * Runtime environment variable schema.
 * Validates all required environment variables at application initialization.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .url("DATABASE_URL must be a valid URL")
    .refine(
      (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must use the postgresql:// or postgres:// protocol",
    ),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(data: Record<string, unknown> = process.env): Env {
  const result = envSchema.safeParse(data);
  if (!result.success) {
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    throw new Error(`Environment validation failed:\n${errorDetails}`);
  }
  return result.data;
}

export function getEnv(): Env {
  return validateEnv(process.env);
}
