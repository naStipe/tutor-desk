import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  [
    "node_modules/supabase/dist/supabase.js",
    "gen",
    "types",
    "--project-id",
    "cmlvtnjoynffrznyelym",
    "--schema",
    "public",
  ],
  { encoding: "utf8" },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr || "Unable to generate hosted database types.\n");
  process.exit(result.status ?? 1);
}

const normalize = (value) => value.replaceAll("\r\n", "\n").trimEnd();
const committed = readFileSync("src/lib/supabase/database.types.ts", "utf8");
if (normalize(committed) !== normalize(result.stdout)) {
  process.stderr.write(
    "Generated database types are out of date. Run pnpm run db:types and commit the result.\n",
  );
  process.exit(1);
}

process.stdout.write("Generated database types match the hosted project.\n");
