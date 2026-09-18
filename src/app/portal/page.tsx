import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "../../components/Avatar";
import { Card } from "../../components/Card";
import { PageHeader } from "../../components/PageHeader";
import { listHomeworkDueInRange, listHomeworkRecentFeedback } from "../../features/homework/data";
import { addDays } from "../../features/lessons/date-utils";
import { NextLessonCard } from "../../features/portal/components/NextLessonCard";
import { getPortalUnpaidSummary, listPortalLessons } from "../../features/portal/data";
import { requirePortalStudent } from "../../features/portal/resolve";
import { getTutorFormatSettings, getTutorProfile } from "../../features/tutor-profile/data";
import { formatMoney } from "../../lib/formatting";
import { getCurrentUser } from "../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

const LOOKAHEAD_DAYS = 30;
const HOMEWORK_DUE_WINDOW_DAYS = 14;

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student: studentId } = await searchParams;
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const student = await requirePortalStudent(supabase, studentId);

  const now = new Date();
  const lookaheadEnd = addDays(now, LOOKAHEAD_DAYS);
  const homeworkDueEnd = addDays(now, HOMEWORK_DUE_WINDOW_DAYS);

  const [
    upcomingLessons,
    homeworkDue,
    recentFeedback,
    unpaidSummary,
    tutorProfile,
    { timeZone, locale },
  ] = await Promise.all([
    listPortalLessons(supabase, student.id, {
      start: now.toISOString(),
      end: lookaheadEnd.toISOString(),
    }),
    listHomeworkDueInRange(
      supabase,
      { start: now.toISOString(), end: homeworkDueEnd.toISOString() },
      { studentId: student.id },
    ),
    listHomeworkRecentFeedback(supabase, student.id, 3),
    getPortalUnpaidSummary(supabase, student.id),
    getTutorProfile(supabase, student.tutor_id),
    getTutorFormatSettings(supabase, student.tutor_id),
  ]);

  const nextLesson = upcomingLessons
    .filter((lesson) => lesson.status === "scheduled")
    .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

  const tutorName = tutorProfile?.name || "Your tutor";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${student.name.split(" ")[0]}`}
        description={`Timezone: ${timeZone}`}
      />

      {nextLesson ? (
        <NextLessonCard
          startTime={nextLesson.start_time}
          endTime={nextLesson.end_time}
          subjectName={nextLesson.subject_name}
          meetingUrl={nextLesson.meeting_url}
          timeZone={timeZone}
          locale={locale}
        />
      ) : (
        <Card>
          <h2 className="text-sm font-semibold text-ink">Next lesson</h2>
          <p className="mt-1 text-sm text-ink-subtle">No upcoming lessons scheduled.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-ink">Homework due soon</h2>
          {homeworkDue.length === 0 ? (
            <p className="mt-1 text-sm text-ink-subtle">Nothing due in the next two weeks.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {homeworkDue.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/portal/homework"
                    className="block text-sm text-ink hover:text-brand hover:underline"
                  >
                    {item.title}
                    {item.due_date && (
                      <span className="ml-2 text-xs text-ink-subtle">
                        Due{" "}
                        {new Date(`${item.due_date}T00:00:00Z`).toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink">Recent feedback</h2>
          {recentFeedback.length === 0 ? (
            <p className="mt-1 text-sm text-ink-subtle">No feedback yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recentFeedback.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/portal/homework"
                    className="text-sm font-medium text-ink hover:text-brand"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{item.feedback_text}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {unpaidSummary.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-ink">Amount due</h2>
          <div className="mt-2 space-y-1">
            {unpaidSummary.map((row) => (
              <p key={row.currency} className="text-sm text-ink-muted">
                {formatMoney(row.total, row.currency, locale)} across {row.count} lesson
                {row.count === 1 ? "" : "s"}
              </p>
            ))}
          </div>
          <Link
            href="/portal/teacher"
            className="mt-2 inline-block text-sm text-brand hover:text-brand-strong hover:underline"
          >
            Payment instructions &rarr;
          </Link>
        </Card>
      )}

      <Card className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={tutorName} size="sm" />
          <div>
            <p className="text-sm font-medium text-ink">{tutorName}</p>
            <p className="text-sm text-ink-subtle">Your tutor</p>
          </div>
        </div>
        <Link
          href="/portal/teacher"
          className="text-sm text-brand hover:text-brand-strong hover:underline"
        >
          Contact &rarr;
        </Link>
      </Card>
    </div>
  );
}
