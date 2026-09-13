import { redirect } from "next/navigation";
import { TodayDashboard } from "../../features/dashboard/components/TodayDashboard";
import { getTodayDashboardData } from "../../features/dashboard/data";
import { firstNameFromEmail } from "../../lib/display-name";
import { cached } from "../../lib/cache";
import { getCurrentUser } from "../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { todaysLessons, homeworkAttention, unbilled, weekLoad } = await cached(
    `today-dashboard:${user.id}`,
    [`lessons:${user.id}`, `homework:${user.id}`],
    30_000,
    () => getTodayDashboardData(supabase),
  );

  const lessons = todaysLessons.map((lesson) => ({
    id: lesson.id,
    startTime: lesson.start_time,
    endTime: lesson.end_time,
    status: lesson.status,
    notes: lesson.notes,
    studentId: lesson.student_id,
    studentName: lesson.student?.name ?? "Unknown student",
  }));

  const homework = homeworkAttention.map(({ homework: item, overdue }) => ({
    id: item.id,
    title: item.title,
    studentName: item.student?.name ?? "Unknown student",
    overdue,
    submittedAt: item.submitted_at,
    dueDate: item.due_date,
  }));

  return (
    <TodayDashboard
      firstName={firstNameFromEmail(user.email ?? "")}
      lessons={lessons}
      homework={homework}
      unbilled={unbilled}
      weekLoad={weekLoad}
    />
  );
}
