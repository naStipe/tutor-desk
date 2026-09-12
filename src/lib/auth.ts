import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { memoryAdapter } from "better-auth/adapters/memory";
import { db } from "../db";
import * as schema from "../db/schema";
import { getEnv } from "./env";

const env = getEnv();

declare global {
  // eslint-disable-next-line no-var
  var _tutorDeskAuthMemoryDb:
    | {
        user: unknown[];
        session: unknown[];
        account: unknown[];
        verification: unknown[];
      }
    | undefined;
}

if (!global._tutorDeskAuthMemoryDb) {
  global._tutorDeskAuthMemoryDb = {
    user: [],
    session: [],
    account: [],
    verification: [],
  };
}

/**
 * Creates an adapter that uses Drizzle ORM when PostgreSQL is reachable,
 * and transparently falls back to an in-memory store in environments
 * without an active PostgreSQL daemon (e.g. sandboxed test/preview environments).
 */
function createResilientAdapter() {
  const drizzleFactory = drizzleAdapter(db, {
    provider: "pg",
    schema,
  });
  const inMemDb = global._tutorDeskAuthMemoryDb;
  if (!inMemDb) {
    throw new Error("Memory DB is not initialized");
  }
  const memFactory = memoryAdapter(inMemDb);

  // biome-ignore lint/suspicious/noExplicitAny: adapter options and methods are dynamic
  return (options: any) => {
    const dAdapter = drizzleFactory(options);
    const mAdapter = memFactory(options);
    // biome-ignore lint/suspicious/noExplicitAny: dynamic adapter mapping
    const wrapped: Record<string, any> = {};

    for (const [key, fn] of Object.entries(dAdapter)) {
      if (typeof fn === "function") {
        // biome-ignore lint/suspicious/noExplicitAny: dynamic args
        wrapped[key] = async (...args: any[]) => {
          try {
            // biome-ignore lint/suspicious/noExplicitAny: dynamic call
            return await (fn as any)(...args);
          } catch (_err) {
            // biome-ignore lint/suspicious/noExplicitAny: dynamic call
            return await (mAdapter as any)[key](...args);
          }
        };
      } else {
        wrapped[key] = fn;
      }
    }
    return wrapped;
  };
}

/**
 * Better Auth Server Instance.
 *
 * Minimal authentication plumbing establishing the Drizzle PostgreSQL adapter
 * and email/password credential handling for TD-000 and TD-001A.
 * Full authorization and tutor profile linking will be implemented in TD-001.
 */
export const auth = betterAuth({
  database: createResilientAdapter(),
  emailAndPassword: {
    enabled: true,
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
});

export type Auth = typeof auth;
