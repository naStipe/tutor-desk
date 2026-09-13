import { redirect } from "next/navigation";
import { Card } from "../../../components/Card";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeader } from "../../../components/PageHeader";
import { createSubjectAction, deleteSubjectAction } from "../../../features/subjects/actions";
import { SubjectForm } from "../../../features/subjects/components/SubjectForm";
import { listSubjects } from "../../../features/subjects/data";
import { cachedForTutor, tutorTag } from "../../../lib/query-cache";
import { getCurrentUser } from "../../../lib/supabase/current-user";
import { createTokenClient } from "../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;
  const subjects = await cachedForTutor(
    "subjects",
    [user.id],
    [tutorTag("subjects", user.id)],
    30,
    () => listSubjects(client),
  );

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title="Subjects"
        description="The subjects you teach. Set an hourly rate per student on each student's page."
      />

      <Card>
        <SubjectForm action={createSubjectAction} />
      </Card>

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          description="Add a subject before setting hourly rates for your students."
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden p-0">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <p className="text-sm font-medium text-ink">{subject.name}</p>
              <form action={deleteSubjectAction}>
                <input type="hidden" name="id" value={subject.id} />
                <button type="submit" className="text-sm text-ink-muted hover:text-danger">
                  Delete
                </button>
              </form>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
