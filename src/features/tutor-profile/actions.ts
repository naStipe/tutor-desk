"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { tutorTag } from "../../lib/query-cache";
import { createClient } from "../../lib/supabase/server";
import { listUpcomingLessonTimes } from "../lessons/data";
import { minutesSinceMidnightInZone } from "../lessons/date-utils";
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
    workingHoursStartMinutes: formData.get("workingHoursStart"),
    workingHoursEndMinutes: formData.get("workingHoursEnd"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in again." };

  const upcomingLessons = await listUpcomingLessonTimes(supabase, new Date().toISOString());
  const outOfBoundsCount = upcomingLessons.filter((lesson) => {
    const startMinutes = minutesSinceMidnightInZone(
      new Date(lesson.start_time),
      parsed.data.timezone,
    );
    const endMinutes =
      startMinutes +
      Math.round(
        (new Date(lesson.end_time).getTime() - new Date(lesson.start_time).getTime()) / 60000,
      );
    return (
      startMinutes < parsed.data.workingHoursStartMinutes ||
      endMinutes > parsed.data.workingHoursEndMinutes
    );
  }).length;

  if (outOfBoundsCount > 0) {
    return {
      error:
        outOfBoundsCount === 1
          ? "1 upcoming lesson falls outside these working hours. Move or cancel it first."
          : `${outOfBoundsCount} upcoming lessons fall outside these working hours. Move or cancel them first.`,
    };
  }

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
