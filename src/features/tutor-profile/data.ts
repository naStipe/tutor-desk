import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import type { TutorProfileSettingsInput } from "./schemas";

export async function ensureCurrentTutorProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data: profile, error } = await supabase
    .from("tutor_profile")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("user_id, name, created_at, updated_at")
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

export async function getTutorProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("tutor_profile")
    .select(
      "user_id, name, timezone, locale, currency, default_hourly_rate, payment_instructions, contact_email, contact_phone",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load tutor profile: ${error.message}`);
  return data;
}

export async function updateTutorProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: TutorProfileSettingsInput,
) {
  const { error } = await supabase
    .from("tutor_profile")
    .update({
      name: input.name ?? null,
      timezone: input.timezone,
      locale: input.locale,
      currency: input.currency,
      default_hourly_rate: input.defaultHourlyRate ?? null,
      payment_instructions: input.paymentInstructions ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw new Error(`Unable to update tutor profile: ${error.message}`);
}
