import { redirect } from "next/navigation";
import { EmptyState } from "../../components/EmptyState";
import { LinkButton } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { countUpcomingLessons } from "../../features/lessons/data";
import { listActiveStudents } from "../../features/students/data";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");

  const [students, upcomingLessonCount] = await Promise.all([
    listActiveStudents(supabase),
    countUpcomingLessons(supabase),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting()}`}
        description="Here's what's happening with your tutoring business."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-sm font-medium text-slate-500">Active students</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{students.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-sm font-medium text-slate-500">Upcoming lessons</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {upcomingLessonCount}
          </p>
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="Welcome to TutorDesk"
          description="Start by adding your first student."
          action={<LinkButton href="/dashboard/students/new">Add student</LinkButton>}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Add a student or schedule a lesson.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href="/dashboard/students/new">Add student</LinkButton>
            <LinkButton href="/dashboard/lessons/new" variant="secondary">
              Schedule lesson
            </LinkButton>
          </div>
        </div>
      )}
    </div>
  );
}
