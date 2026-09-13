import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";

export async function ensureCurrentTutorProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data: profile, error } = await supabase
    .from("tutor_profile")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("user_id, created_at, updated_at")
    .single();

  if (error) throw new Error(`Unable to initialize tutor profile: ${error.message}`);
  return profile;
}
