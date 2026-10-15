import { createClient } from "@supabase/supabase-js";
import { getEnv } from "../env";
import type { Database } from "./database.types";

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY. See docs/SECURITY.md ("Service-role
 * boundary" and "Account deletion"). Import it only from src/features/notifications/ and
 * src/features/account/, only on the server, and only after the caller has been
 * authenticated (cron secret or a validated tutor session). Never pass raw user input into its
 * queries; only values derived from the validated session or from database rows.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("The admin Supabase client must never be created in the browser.");
  }
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");

  return createClient<Database>(getEnv().NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
