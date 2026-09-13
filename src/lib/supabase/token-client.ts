import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "../env";
import type { Database } from "./database.types";

/**
 * A Supabase client authenticated via a raw access token instead of cookies.
 * Needed for queries run inside unstable_cache() — Next.js forbids calling
 * cookies()/headers() there, so the cookie-based server client can't be used.
 * RLS still enforces access the same way; this only changes how the request
 * carries the caller's identity.
 */
export function createTokenClient(accessToken: string) {
  const env = getEnv();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
