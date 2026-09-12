import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import { envSchema } from "./src/lib/env";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString = envSchema.shape.DATABASE_URL.parse(process.env.DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
});
