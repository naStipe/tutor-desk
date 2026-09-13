import { cache } from "react";
import { createClient } from "./server";

type CurrentUser = { id: string; email: string | null };

/**
 * Resolves the signed-in user once per request. Uses getClaims() rather
 * than getUser() — this project signs JWTs asymmetrically (ES256, confirmed
 * via its JWKS endpoint), so getClaims() verifies the session's cookie
 * locally against the cached JWKS. getUser() by contrast always makes a
 * network round trip to Supabase's auth server on every call, regardless of
 * signing algorithm — on every single page navigation, that adds up. The
 * cookie itself is what's being verified (same trust boundary as before);
 * this only changes how that verification happens, not what's trusted.
 * React's cache() also dedupes this between the layout and the page it
 * wraps within one request. accessToken lets callers build a token-based
 * client for use inside unstable_cache(), where cookies() isn't allowed.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const [{ data: claimsData, error }, { data: sessionData }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.auth.getSession(),
  ]);

  const claims = claimsData?.claims;
  if (error || !claims || typeof claims.sub !== "string") {
    return { supabase, user: null, accessToken: null };
  }

  const user: CurrentUser = {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
  return { supabase, user, accessToken: sessionData.session?.access_token ?? null };
});
