import { redirect } from "next/navigation";
import { Card } from "../../../components/Card";
import { PageHeader } from "../../../components/PageHeader";
import { updateTutorProfileAction } from "../../../features/tutor-profile/actions";
import { SettingsForm } from "../../../features/tutor-profile/components/SettingsForm";
import { getTutorProfile } from "../../../features/tutor-profile/data";
import { getCurrentUser } from "../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const profile = await getTutorProfile(supabase, user.id);

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Settings" description="Your profile, timezone, and payment defaults." />
      <Card>
        <SettingsForm
          action={updateTutorProfileAction}
          defaultValues={{
            name: profile?.name ?? "",
            timezone: profile?.timezone ?? "UTC",
            locale: profile?.locale ?? "en-US",
            currency: profile?.currency ?? "RUB",
            defaultHourlyRate:
              profile?.default_hourly_rate !== null && profile?.default_hourly_rate !== undefined
                ? String(profile.default_hourly_rate)
                : "",
            paymentInstructions: profile?.payment_instructions ?? "",
            contactEmail: profile?.contact_email ?? "",
            contactPhone: profile?.contact_phone ?? "",
          }}
        />
      </Card>
    </div>
  );
}
