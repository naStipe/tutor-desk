import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PortalShell } from "../../components/PortalShell";
import { requirePortalStudent } from "../../features/portal/resolve";
import { getCurrentUser } from "../../lib/supabase/current-user";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const student = await requirePortalStudent(supabase);

  return <PortalShell studentName={student.name}>{children}</PortalShell>;
}
