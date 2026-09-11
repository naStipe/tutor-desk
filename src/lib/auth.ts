import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
import { env } from "./env";

/**
 * Better Auth Server Instance.
 *
 * Minimal authentication plumbing establishing the Drizzle PostgreSQL adapter
 * and email/password credential handling for TD-000.
 * Full authorization and tutor profile linking will be implemented in TD-001.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
});

export type Auth = typeof auth;
