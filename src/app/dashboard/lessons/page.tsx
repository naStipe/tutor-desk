import { redirect } from "next/navigation";
import { LessonsListView } from "../../../features/lessons/components/LessonsListView";
import { listAllLessonsForTutor } from "../../../features/lessons/data";
import { listActiveStudents } from "../../../features/students/data";
import { listSubjects } from "../../../features/subjects/data";
import { cachedForTutor, tutorTag } from "../../../lib/query-cache";
import { getCurrentUser } from "../../../lib/supabase/current-user";
import { createTokenClient } from "../../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;

  const [lessons, students, subjects] = await Promise.all([
    cachedForTutor("lessons-all", [user.id], [tutorTag("lessons", user.id)], 30, () =>
      listAllLessonsForTutor(client),
    ),
    cachedForTutor("students-active", [user.id], [tutorTag("students", user.id)], 120, () =>
      listActiveStudents(client),
    ),
    cachedForTutor("subjects", [user.id], [tutorTag("subjects", user.id)], 120, () =>
      listSubjects(client),
    ),
  ]);

  const listLessons = lessons.map((lesson) => ({
    id: lesson.id,
    studentId: lesson.student_id,
    studentName: lesson.student?.name ?? "Unknown student",
    subjectId: lesson.subject_id,
    subjectName: lesson.subject?.name ?? null,
    startTime: lesson.start_time,
    status: lesson.status as "scheduled" | "completed" | "cancelled" | "no_show",
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
    />
  );
}
