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

const FALLBACK_TIMEZONE = "UTC";
const FALLBACK_LOCALE = "en-US";

export async function getTutorTimezone(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("tutor_profile")
    .select("timezone")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load tutor timezone: ${error.message}`);
  return data?.timezone ?? FALLBACK_TIMEZONE;
}

/** Wall-clock formatting settings for a tutor: their configured timezone and display locale. */
export async function getTutorFormatSettings(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("tutor_profile")
    .select("timezone, locale")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load tutor settings: ${error.message}`);
  return {
    timeZone: data?.timezone ?? FALLBACK_TIMEZONE,
    locale: data?.locale ?? FALLBACK_LOCALE,
  };
}
