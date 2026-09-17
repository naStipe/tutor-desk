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
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          {(tutorProfile?.contact_email || tutorProfile?.contact_phone) && (
            <div className="mt-1 space-y-0.5">
              {tutorProfile?.contact_email && (
                <a
                  href={`mailto:${tutorProfile.contact_email}`}
                  className="block text-sm text-brand hover:text-brand-strong hover:underline"
                >
                  {tutorProfile.contact_email}
                </a>
              )}
              {tutorProfile?.contact_phone && (
                <a
                  href={`tel:${tutorProfile.contact_phone}`}
                  className="block text-sm text-brand hover:text-brand-strong hover:underline"
                >
                  {tutorProfile.contact_phone}
                </a>
              )}
            </div>
          )}
        </div>
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
