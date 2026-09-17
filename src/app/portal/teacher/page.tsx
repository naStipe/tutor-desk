import { redirect } from "next/navigation";
import { Avatar } from "../../../components/Avatar";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeader } from "../../../components/PageHeader";
import { requirePortalStudent } from "../../../features/portal/resolve";
import { listSubjects } from "../../../features/subjects/data";
import { getTutorProfile } from "../../../features/tutor-profile/data";
import { formatMoney } from "../../../lib/formatting";
import { getCurrentUser } from "../../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

export default async function PortalTeacherPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student: studentId } = await searchParams;
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const student = await requirePortalStudent(supabase, studentId);

  const [tutorProfile, subjects] = await Promise.all([
    getTutorProfile(supabase, student.tutor_id),
    listSubjects(supabase),
  ]);

  const name = tutorProfile?.name || "Your tutor";

  return (
    <div className="space-y-6">
      <PageHeader title="Teacher" description="Who you're learning with" />

      <Card className="flex items-center gap-4">
        <Avatar name={name} />
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
      </Card>

      {tutorProfile?.payment_instructions && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-ink">Payment instructions</h2>
          <p className="whitespace-pre-wrap text-sm text-ink-muted">
            {tutorProfile.payment_instructions}
          </p>
          {tutorProfile.default_hourly_rate != null && (
            <p className="mt-2 text-sm text-ink-muted">
              Default rate:{" "}
              {formatMoney(tutorProfile.default_hourly_rate, tutorProfile.currency ?? "USD")}
              /hr
            </p>
          )}
        </Card>
      )}

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          description="Your tutor hasn't added any subjects yet."
        />
      ) : (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-ink">Subjects taught</h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <span
                key={subject.id}
                className="rounded-full border border-border bg-surface-muted px-3 py-1 text-sm text-ink-muted"
              >
                {subject.name}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
