import { cache } from "react";
import { createClient } from "./server";

/**
 * Resolves the signed-in user once per request. The layout and the page it
 * wraps both need this, and React's cache() dedupes the underlying
 * auth.getUser()/getSession() calls between them instead of paying for it
 * twice. accessToken lets callers build a token-based client for use inside
 * unstable_cache(), where cookies() isn't allowed.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const [{ data: userData, error }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);

  if (error || !userData.user) {
    return { supabase, user: null, accessToken: null };
  }
  return {
    supabase,
    user: userData.user,
    accessToken: sessionData.session?.access_token ?? null,
  };
});
