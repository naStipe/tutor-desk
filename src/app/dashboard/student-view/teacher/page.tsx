import { redirect } from "next/navigation";
import { Avatar } from "../../../../components/Avatar";
import { Card } from "../../../../components/Card";
import { EmptyState } from "../../../../components/EmptyState";
import { PageHeader } from "../../../../components/PageHeader";
import { listSubjects } from "../../../../features/subjects/data";
import { displayNameFromEmail } from "../../../../lib/display-name";
import { cachedForTutor, tutorTag } from "../../../../lib/query-cache";
import { getCurrentUser } from "../../../../lib/supabase/current-user";
import { createTokenClient } from "../../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

export default async function StudentViewTeacherPage() {
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;
  const email = user.email ?? "";
  const name = displayNameFromEmail(email) || "Tutor";

  const subjects = await cachedForTutor(
    "subjects",
    [user.id],
    [tutorTag("subjects", user.id)],
    120,
    () => listSubjects(client),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Teacher" description="Who you're learning with" />

      <Card className="flex items-center gap-4">
        <Avatar name={name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="truncate font-mono text-xs text-ink-muted">{email}</p>
        </div>
      </Card>

      {subjects.length === 0 ? (
        <EmptyState title="No subjects yet" description="Your tutor hasn't added any subjects yet." />
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
