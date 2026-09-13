import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../components/AppShell";
import { countHomeworkNeedingAttention } from "../../features/homework/data";
import { ensureCurrentTutorProfile } from "../../features/tutor-profile/data";
import { cached } from "../../lib/cache";
import { getCurrentUser } from "../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [, homeworkCount] = await Promise.all([
    cached(`tutor-profile:${user.id}`, [`tutor-profile:${user.id}`], 5 * 60_000, () =>
      ensureCurrentTutorProfile(supabase, user.id),
    ),
    cached(`homework-count:${user.id}`, [`homework:${user.id}`], 30_000, () =>
      countHomeworkNeedingAttention(supabase),
    ),
  ]);

  return (
    <AppShell email={user.email ?? ""} homeworkCount={homeworkCount}>
      {children}
    </AppShell>
  );
}
