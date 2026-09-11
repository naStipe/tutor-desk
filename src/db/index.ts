import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "../lib/env";

declare global {
  // eslint-disable-next-line no-var
  var _tutorDeskPgPool: Pool | undefined;
}

/**
 * Returns a pooled PostgreSQL client instance.
 * Reuses existing pool during hot-reloads and development cycles.
 */
export function getDbPool(): Pool {
  if (!global._tutorDeskPgPool) {
    global._tutorDeskPgPool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    global._tutorDeskPgPool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL pool client:", err);
    });
  }

  return global._tutorDeskPgPool;
}

export const pool = getDbPool();
export const db = drizzle(pool, { schema });
