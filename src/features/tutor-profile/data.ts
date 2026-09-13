import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";

export async function ensureCurrentTutorProfile(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("A validated tutor session is required.");

  const { error: insertError } = await supabase
    .from("tutor_profile")
    .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

  if (insertError) throw new Error(`Unable to initialize tutor profile: ${insertError.message}`);

  const { data: profile, error: selectError } = await supabase
    .from("tutor_profile")
    .select("user_id, created_at, updated_at")
    .single();

  if (selectError) throw new Error(`Unable to load tutor profile: ${selectError.message}`);
  return profile;
}
