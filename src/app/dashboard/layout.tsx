import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../components/AppShell";
import { countHomeworkNeedingAttention } from "../../features/homework/data";
import { ensureCurrentTutorProfile } from "../../features/tutor-profile/data";
import { cachedForTutor, tutorTag } from "../../lib/query-cache";
import { getCurrentUser } from "../../lib/supabase/current-user";
import { createTokenClient } from "../../lib/supabase/token-client";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { supabase, user, accessToken } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const client = accessToken ? createTokenClient(accessToken) : supabase;

  const [, homeworkCount] = await Promise.all([
    cachedForTutor("tutor-profile", [user.id], [`tutor-profile:${user.id}`], 5 * 60, () =>
      ensureCurrentTutorProfile(client, user.id),
    ),
    cachedForTutor("homework-count", [user.id], [tutorTag("homework", user.id)], 30, () =>
      countHomeworkNeedingAttention(client),
    ),
  ]);

  return (
    <AppShell email={user.email ?? ""} homeworkCount={homeworkCount}>
      {children}
    </AppShell>
  );
}
