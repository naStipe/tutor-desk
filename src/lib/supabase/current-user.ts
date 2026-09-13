import { cache } from "react";
import { createClient } from "./server";

/**
 * Resolves the signed-in user once per request. The layout and the page it
 * wraps both need this, and React's cache() dedupes the underlying
 * auth.getUser() call between them instead of paying for it twice.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
});
