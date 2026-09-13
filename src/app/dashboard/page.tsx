import { redirect } from "next/navigation";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { LinkButton } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { StatCard } from "../../components/StatCard";
import { BookIcon, CalendarIcon, UsersIcon } from "../../components/icons";
import { countHomeworkToReview } from "../../features/homework/data";
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

  const [students, upcomingLessonCount, homeworkToReviewCount] = await Promise.all([
    listActiveStudents(supabase),
    countUpcomingLessons(supabase),
    countHomeworkToReview(supabase),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting()}`}
        description="Here's what's happening with your tutoring business."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active students" value={students.length} icon={UsersIcon} tone="brand" />
        <StatCard
          label="Upcoming lessons"
          value={upcomingLessonCount}
          icon={CalendarIcon}
          tone="cyan"
        />
        <StatCard
          label="Homework to review"
          value={homeworkToReviewCount}
          icon={BookIcon}
          tone="violet"
        />
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="Welcome to TutorDesk"
          description="Start by adding your first student."
          action={<LinkButton href="/dashboard/students/new">Add student</LinkButton>}
        />
      ) : (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Quick actions</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Add a student, schedule a lesson, or assign homework.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href="/dashboard/students/new">Add student</LinkButton>
            <LinkButton href="/dashboard/lessons/new" variant="secondary">
              Schedule lesson
            </LinkButton>
            <LinkButton href="/dashboard/homework/new" variant="secondary">
              Assign homework
            </LinkButton>
          </div>
        </Card>
      )}
    </div>
  );
}
