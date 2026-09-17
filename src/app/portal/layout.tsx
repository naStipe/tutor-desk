import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PortalShell } from "../../components/PortalShell";
import { listPortalStudents } from "../../features/portal/data";
import { getCurrentUser } from "../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const students = await listPortalStudents(supabase);
  if (students.length === 0) redirect("/sign-in");

  return <PortalShell students={students}>{children}</PortalShell>;
}
