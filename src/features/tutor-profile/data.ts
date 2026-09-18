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

/**
 * Fills in the tutor's timezone from their browser the first time they load the app, so most
 * tutors never have to find the setting themselves. Only applies while the profile is still at
 * its untouched defaults (timezone is still the "UTC" the row was created with, and it has never
 * been saved through Settings, i.e. `updated_at` still equals `created_at`) — once a tutor has
 * explicitly saved settings this becomes a no-op, so it never overwrites a deliberate choice.
 */
export async function autoDetectTutorTimezone(
  supabase: SupabaseClient<Database>,
  userId: string,
  timezone: string,
) {
  const { data: profile, error: readError } = await supabase
    .from("tutor_profile")
    .select("timezone, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw new Error(`Unable to load tutor profile: ${readError.message}`);
  if (!profile) return;
  if (profile.timezone !== FALLBACK_TIMEZONE || profile.updated_at !== profile.created_at) return;

  const { error } = await supabase
    .from("tutor_profile")
    .update({ timezone })
    .eq("user_id", userId)
    .eq("timezone", FALLBACK_TIMEZONE)
    .eq("updated_at", profile.updated_at);

  if (error) throw new Error(`Unable to set timezone: ${error.message}`);
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
