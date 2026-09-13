import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../components/AppShell";
import { ensureCurrentTutorProfile } from "../../features/tutor-profile/data";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  await ensureCurrentTutorProfile(supabase);

  return <AppShell email={data.user.email ?? ""}>{children}</AppShell>;
}
