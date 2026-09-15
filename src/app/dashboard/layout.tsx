import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../components/AppShell";
import { countHomeworkNeedingAttention } from "../../features/homework/data";
import { listActiveStudents } from "../../features/students/data";
import { ensureCurrentTutorProfile } from "../../features/tutor-profile/data";
import { cachedForTutor, tutorTag } from "../../lib/query-cache";
import { getCurrentUser } from "../../lib/supabase/current-user";
import { createTokenClient } from "../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;

  const [profileResult, homeworkCountResult, studentsResult] = await Promise.allSettled([
    cachedForTutor("tutor-profile", [user.id], [`tutor-profile:${user.id}`], 5 * 60, () =>
      ensureCurrentTutorProfile(client, user.id),
    ),
    cachedForTutor("homework-count", [user.id], [tutorTag("homework", user.id)], 30, () =>
      countHomeworkNeedingAttention(client),
    ),
    cachedForTutor("students-active", [user.id], [tutorTag("students", user.id)], 120, () =>
      listActiveStudents(client),
    ),
  ]);
  const name = profileResult.status === "fulfilled" ? profileResult.value.name : null;
  const homeworkCount = homeworkCountResult.status === "fulfilled" ? homeworkCountResult.value : 0;
  const students = studentsResult.status === "fulfilled" ? studentsResult.value : [];

  return (
    <AppShell
      email={user.email ?? ""}
      name={name}
      homeworkCount={homeworkCount}
      students={students.map((student) => ({ id: student.id, name: student.name }))}
    >
      {children}
    </AppShell>
  );
}
