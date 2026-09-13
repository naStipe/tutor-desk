import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../components/AppShell";
import { countHomeworkNeedingAttention } from "../../features/homework/data";
import { ensureCurrentTutorProfile } from "../../features/tutor-profile/data";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");

  const [, homeworkCount] = await Promise.all([
    ensureCurrentTutorProfile(supabase, data.user.id),
    countHomeworkNeedingAttention(supabase),
  ]);

  return (
    <AppShell email={data.user.email ?? ""} homeworkCount={homeworkCount}>
      {children}
    </AppShell>
  );
}
