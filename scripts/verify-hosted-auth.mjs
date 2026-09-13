import { randomUUID } from "node:crypto";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

function readLocalEnvironment() {
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/u)
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1).replace(/^"|"$/gu, "")];
      }),
  );
}

const env = readLocalEnvironment();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !publishableKey) throw new Error("Hosted Supabase public environment is missing.");

const email = `tutordesk-td001s-${randomUUID()}@example.com`;
const password = `${randomUUID()}Aa1!`;
const cleanupFile = ".tmp-hosted-auth-cleanup.sql";
const supabase = createClient(url, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

try {
  const { data: signup, error: signupError } = await supabase.auth.signUp({ email, password });
  if (signupError) throw signupError;
  if (!signup.user) throw new Error("Hosted signup returned no user.");

  if (!signup.session) {
    process.stdout.write(
      "Hosted signup requires email confirmation; callback handling is compiled but login smoke testing was skipped.\n",
    );
  } else {
    const { error: profileError } = await supabase
      .from("tutor_profile")
      .upsert({ user_id: signup.user.id }, { onConflict: "user_id", ignoreDuplicates: true });
    if (profileError) throw profileError;

    const { data: profile, error: selectError } = await supabase
      .from("tutor_profile")
      .select("user_id")
      .single();
    if (selectError || profile?.user_id !== signup.user.id) {
      throw selectError ?? new Error("Tutor profile did not match the signed-in user.");
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) throw loginError;
    const { data: validated, error: validationError } = await supabase.auth.getUser();
    if (validationError || validated.user?.id !== signup.user.id) {
      throw validationError ?? new Error("Hosted login did not restore the expected identity.");
    }
    await supabase.auth.signOut();
    process.stdout.write(
      "Hosted signup, profile initialization, logout, login, and identity validation passed.\n",
    );
  }
} finally {
  writeFileSync(cleanupFile, `delete from auth.users where email = '${email}';\n`, "utf8");
  const cleanup = spawnSync(
    process.execPath,
    ["node_modules/supabase/dist/supabase.js", "db", "query", "--linked", "--file", cleanupFile],
    { encoding: "utf8" },
  );
  unlinkSync(cleanupFile);
  if (cleanup.status !== 0) {
    process.stderr.write("Hosted Auth smoke-test user cleanup failed.\n");
    process.exitCode = 1;
  }
}
