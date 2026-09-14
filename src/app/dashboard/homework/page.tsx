import { redirect } from "next/navigation";
import { HomeworkListView } from "../../../features/homework/components/HomeworkListView";
import { listHomework } from "../../../features/homework/data";
import { listActiveStudents } from "../../../features/students/data";
import { listSubjects } from "../../../features/subjects/data";
import { cachedForTutor, tutorTag } from "../../../lib/query-cache";
import { getCurrentUser } from "../../../lib/supabase/current-user";
import { createTokenClient } from "../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

export default async function HomeworkPage() {
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;

  const [homework, students, subjects] = await Promise.all([
    cachedForTutor("homework-list", [user.id], [tutorTag("homework", user.id)], 30, () =>
      listHomework(client),
    ),
    cachedForTutor("students-active", [user.id], [tutorTag("students", user.id)], 120, () =>
      listActiveStudents(client),
    ),
    cachedForTutor("subjects", [user.id], [tutorTag("subjects", user.id)], 120, () =>
      listSubjects(client),
    ),
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
    />
  );
}
