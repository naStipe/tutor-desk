import { redirect } from "next/navigation";
import { TodayDashboard } from "../../features/dashboard/components/TodayDashboard";
import { getTodayDashboardData } from "../../features/dashboard/data";
import { ensureUpcomingLessonsGenerated } from "../../features/lessons/recurrence";
import { getTutorFormatSettings } from "../../features/tutor-profile/data";
import { firstNameFromEmail } from "../../lib/display-name";
import { cachedForTutor, tutorTag } from "../../lib/query-cache";
import { getCurrentUser } from "../../lib/supabase/current-user";
import { createTokenClient } from "../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

function weekLabels(trendStart: Date, weeks: number, locale: string) {
  const labels: string[] = [];
  for (let i = 0; i < weeks - 1; i++) {
    const date = new Date(trendStart);
    date.setDate(date.getDate() + i * 7);
    labels.push(date.toLocaleDateString(locale, { month: "short", day: "2-digit" }).toUpperCase());
  }
  labels.push("THIS WK");
  return labels;
}

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

  const [{ todaysLessons, homeworkAttention, unbilled, weekLoad, analytics }, { locale }] =
    await Promise.all([
      generatedNewLessons
        ? getTodayDashboardData(client)
        : cachedForTutor(
            "today-dashboard",
            [user.id],
            [
              tutorTag("lessons", user.id),
              tutorTag("homework", user.id),
              tutorTag("students", user.id),
              tutorTag("subjects", user.id),
            ],
            30,
            () => getTodayDashboardData(client),
          ),
      cachedForTutor("format-settings", [user.id], [tutorTag("profile", user.id)], 300, () =>
        getTutorFormatSettings(client, user.id),
      ),
    ]);

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

  const upcomingAfterToday = analytics.upcomingAfterToday.map((lesson) => ({
    ...lesson,
    studentName: analytics.studentNames.get(lesson.studentId) ?? "Unknown student",
  }));

  return (
    <TodayDashboard
      firstName={firstNameFromEmail(user.email ?? "")}
      locale={locale}
      lessons={lessons}
      homework={homework}
      unbilled={unbilled}
      weekLoad={weekLoad}
      analytics={{
        hoursTrend: analytics.hoursTrend,
        weekLabels: weekLabels(analytics.trendStart, analytics.hoursTrend.length, locale),
        monthHours: analytics.monthHours,
        monthVsPrevPct: analytics.monthVsPrevPct,
        subjectSplit: analytics.subjectSplit,
        heatmap: analytics.heatmap,
        studentsOverview: analytics.studentsOverview,
        upcomingAfterToday,
      }}
    />
  );
}
