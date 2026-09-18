import { redirect } from "next/navigation";
import { Card } from "../../../../components/Card";
import { PageHeader } from "../../../../components/PageHeader";
import { createStudentAction } from "../../../../features/students/actions";
import { StudentForm } from "../../../../features/students/components/StudentForm";
import { getTutorProfile } from "../../../../features/tutor-profile/data";
import { getCurrentUser } from "../../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const profile = await getTutorProfile(supabase, user.id);

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Add student" description="Create a new student record." />
      <Card>
        <StudentForm
          action={createStudentAction}
          submitLabel="Add student"
          pendingLabel="Adding…"
          tutorDefaultCurrency={profile?.currency ?? undefined}
          tutorDefaultHourlyRate={
            profile?.default_hourly_rate !== null && profile?.default_hourly_rate !== undefined
              ? String(profile.default_hourly_rate)
              : undefined
          }
        />
      </Card>
    </div>
  );
}
