import { redirect } from "next/navigation";
import { TodayDashboard } from "../../features/dashboard/components/TodayDashboard";
import { getTodayDashboardData } from "../../features/dashboard/data";
import { firstNameFromEmail } from "../../lib/display-name";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");

  const { todaysLessons, homeworkAttention, unbilled, weekLoad } =
    await getTodayDashboardData(supabase);

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
      firstName={firstNameFromEmail(data.user.email ?? "")}
      lessons={lessons}
      homework={homework}
      unbilled={unbilled}
      weekLoad={weekLoad}
    />
  );
}
