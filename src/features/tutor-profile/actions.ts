"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { tutorTag } from "../../lib/query-cache";
import { createClient } from "../../lib/supabase/server";
import { autoDetectTutorTimezone, updateTutorProfile } from "./data";
import { tutorProfileSettingsSchema } from "./schemas";

export type TutorProfileActionState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateTutorProfileAction(
  _state: TutorProfileActionState,
  formData: FormData,
): Promise<TutorProfileActionState> {
  const parsed = tutorProfileSettingsSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone"),
    locale: formData.get("locale"),
    currency: formData.get("currency"),
    defaultHourlyRate: formData.get("defaultHourlyRate"),
    paymentInstructions: formData.get("paymentInstructions"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in again." };

  try {
    await updateTutorProfile(supabase, user.id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to save settings." };
  }

  revalidateTag(tutorTag("profile", user.id));
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { message: "Settings saved." };
}

const SUPPORTED_TIMEZONES =
  typeof Intl.supportedValuesOf === "function" ? new Set(Intl.supportedValuesOf("timeZone")) : null;

/** Silently fills in the tutor's timezone from their browser; see `autoDetectTutorTimezone`. */
export async function autoDetectTimezoneAction(timezone: string): Promise<void> {
  if (SUPPORTED_TIMEZONES && !SUPPORTED_TIMEZONES.has(timezone)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await autoDetectTutorTimezone(supabase, user.id, timezone);
  revalidateTag(tutorTag("profile", user.id));
}
