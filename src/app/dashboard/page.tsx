import { redirect } from "next/navigation";
import { TodayDashboard } from "../../features/dashboard/components/TodayDashboard";
import { getTodayDashboardData } from "../../features/dashboard/data";
import { ensureUpcomingLessonsGenerated } from "../../features/lessons/recurrence";
import { firstNameFromEmail } from "../../lib/display-name";
import { cachedForTutor, tutorTag } from "../../lib/query-cache";
import { getCurrentUser } from "../../lib/supabase/current-user";
import { createTokenClient } from "../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;

  // Shares its cache key with the schedule page's gate: series generation is a write path,
  // expensive to check on every navigation, and only matters once new occurrences fall due.
  const generatedNewLessons = await cachedForTutor(
    "ensure-lessons-generated",
    [user.id],
    [tutorTag("lessons", user.id)],
    3600,
    () => ensureUpcomingLessonsGenerated(client, user.id),
  );

  const { todaysLessons, homeworkAttention, unbilled, weekLoad } = generatedNewLessons
    ? await getTodayDashboardData(client)
    : await cachedForTutor(
        "today-dashboard",
        [user.id],
        [tutorTag("lessons", user.id), tutorTag("homework", user.id)],
        30,
        () => getTodayDashboardData(client),
      );

  const lessons = todaysLessons.map((lesson) => ({
    id: lesson.id,
    startTime: lesson.start_time,
    endTime: lesson.end_time,
    status: lesson.status,
    notes: lesson.notes,
    meetingUrl: lesson.meeting_url,
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
