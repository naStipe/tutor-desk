import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { Database } from "../../lib/supabase/database.types";

/** The student record backing the signed-in portal user, or a redirect if none is linked. */
export async function requirePortalStudent(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("portal_get_student").maybeSingle();

  if (error) throw new Error(`Unable to load your student profile: ${error.message}`);
  if (!data) redirect("/sign-in");
  return data;
}
