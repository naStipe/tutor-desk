import { redirect } from "next/navigation";
import { LessonsListView } from "../../../features/lessons/components/LessonsListView";
import { type LessonListSortKey, listLessonsPage } from "../../../features/lessons/data";
import { LESSON_STATUSES, type LessonStatus } from "../../../features/lessons/schemas";
import { listActiveStudents } from "../../../features/students/data";
import { listSubjects } from "../../../features/subjects/data";
import { getTutorFormatSettings } from "../../../features/tutor-profile/data";
import { cachedForTutor, tutorTag } from "../../../lib/query-cache";
import { getCurrentUser } from "../../../lib/supabase/current-user";
import { createTokenClient } from "../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const SORT_KEYS: LessonListSortKey[] = ["date", "student", "subject", "status"];

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const status = LESSON_STATUSES.find((value) => value === first(params.status));
  const studentId = first(params.student);
  const subjectId = first(params.subject);
  const sortKey = SORT_KEYS.find((value) => value === first(params.sort)) ?? "date";
  const sortDir = first(params.dir) === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [{ lessons, totalCount }, students, subjects, { timeZone, locale }] = await Promise.all([
    cachedForTutor(
      "lessons-page",
      [user.id, status ?? "", studentId ?? "", subjectId ?? "", sortKey, sortDir, String(page)],
      [tutorTag("lessons", user.id)],
      30,
      () =>
        listLessonsPage(client, {
          status,
          studentId,
          subjectId,
          sortKey,
          sortDir,
          page,
          pageSize: PAGE_SIZE,
        }),
    ),
    cachedForTutor("students-active", [user.id], [tutorTag("students", user.id)], 120, () =>
      listActiveStudents(client),
    ),
    cachedForTutor("subjects", [user.id], [tutorTag("subjects", user.id)], 120, () =>
      listSubjects(client),
    ),
    cachedForTutor("format-settings", [user.id], [tutorTag("profile", user.id)], 300, () =>
      getTutorFormatSettings(client, user.id),
    ),
  ]);

  const listLessons = lessons.map((lesson) => ({
    id: lesson.id,
    studentId: lesson.student_id,
    studentName: lesson.student?.name ?? "Unknown student",
    subjectId: lesson.subject_id,
    subjectName: lesson.subject?.name ?? null,
    startTime: lesson.start_time,
    status: lesson.status as LessonStatus,
    paymentStatus: lesson.payment_status,
    price: lesson.price,
    currency: lesson.currency,
  }));

  return (
    <LessonsListView
      lessons={listLessons}
      students={students}
      subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
      hasStudents={students.length > 0}
      statusFilter={status ?? "all"}
      studentFilter={studentId ?? "all"}
      subjectFilter={subjectId ?? "all"}
      sortKey={sortKey}
      sortDir={sortDir}
      page={page}
      pageSize={PAGE_SIZE}
      totalCount={totalCount}
      timeZone={timeZone}
      locale={locale}
    />
  );
}
