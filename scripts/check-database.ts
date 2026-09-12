import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";

dotenv.config({ path: ".env.local" });
dotenv.config();

const { db, pool } = await import("../src/db");

const expectedTables = ["account", "session", "user", "verification"];

try {
  const connection = await db.execute<{
    database: string;
    serverVersion: string;
  }>(sql`
    select
      current_database() as database,
      current_setting('server_version') as "serverVersion"
  `);

  const tableResult = await db.execute<{ tableName: string }>(sql`
    select table_name as "tableName"
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('account', 'session', 'user', 'verification')
    order by table_name
  `);

  const actualTables = tableResult.rows.map(({ tableName }) => tableName);
  const missingTables = expectedTables.filter((table) => !actualTables.includes(table));

  if (missingTables.length > 0) {
    throw new Error(`Missing Better Auth tables: ${missingTables.join(", ")}`);
  }

  console.log(`Database connection: ok (${connection.rows[0]?.database})`);
  console.log(`PostgreSQL server: ${connection.rows[0]?.serverVersion}`);
  console.log(`Better Auth tables: ${actualTables.join(", ")}`);
} finally {
  await pool.end();
  global._tutorDeskPgPool = undefined;
}
