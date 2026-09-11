import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

// Next.js dev server runner.
// Gracefully absorbs any flags passed by preview control plane.
const binPath = path.resolve("node_modules/.bin");
const nextBin = path.resolve("node_modules/next/dist/bin/next");

const env = {
  ...process.env,
  PATH: `${binPath}:${process.env.PATH || ""}`,
};

const child = spawn(process.execPath, [nextBin, "dev", "-p", "3000", "-H", "0.0.0.0"], {
  stdio: "inherit",
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

