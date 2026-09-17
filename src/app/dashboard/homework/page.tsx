import { redirect } from "next/navigation";
import { HomeworkListView } from "../../../features/homework/components/HomeworkListView";
import { listHomeworkPage } from "../../../features/homework/data";
import { listActiveStudents } from "../../../features/students/data";
import { listSubjects } from "../../../features/subjects/data";
import { getTutorFormatSettings } from "../../../features/tutor-profile/data";
import { cachedForTutor, tutorTag } from "../../../lib/query-cache";
import { getCurrentUser } from "../../../lib/supabase/current-user";
import { createTokenClient } from "../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;

  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const studentId = first(params.student);
  const subjectId = first(params.subject);
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [{ homework, totalCount }, students, subjects, { locale }] = await Promise.all([
    cachedForTutor(
      "homework-page",
      [user.id, studentId ?? "", subjectId ?? "", String(page)],
      [tutorTag("homework", user.id)],
      30,
      () => listHomeworkPage(client, { studentId, subjectId, page, pageSize: PAGE_SIZE }),
    ),
    cachedForTutor("students-active", [user.id], [tutorTag("students", user.id)], 120, () =>
      listActiveStudents(client),
    ),
    cachedForTutor("subjects", [user.id], [tutorTag("subjects", user.id)], 120, () =>
      listSubjects(client),
    ),
    getTutorFormatSettings(client, user.id),
  ]);

  const listItems = homework.map((item) => ({
    id: item.id,
    title: item.title,
    studentId: item.student_id,
    studentName: item.student?.name ?? "Unknown student",
    subjectId: item.subject_id,
    subjectName: item.subject?.name ?? null,
    dueDate: item.due_date,
    status: item.status,
  }));

  return (
    <HomeworkListView
      homework={listItems}
      students={students}
      subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
      studentFilter={studentId ?? "all"}
      subjectFilter={subjectId ?? "all"}
      page={page}
      pageSize={PAGE_SIZE}
      totalCount={totalCount}
      locale={locale}
    />
  );
}
