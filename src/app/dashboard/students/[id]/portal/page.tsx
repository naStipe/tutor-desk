import { notFound } from "next/navigation";
import { InviteCard } from "../../../../../features/students/components/InviteCard";
import { getStudent, listPortalMembers } from "../../../../../features/students/data";
import { createClient } from "../../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudentPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const student = await getStudent(supabase, id);
  if (!student) notFound();

  const portalAccess = await listPortalMembers(supabase, id);

  return (
    <InviteCard
      studentId={student.id}
      members={portalAccess.members}
      pendingInvites={portalAccess.pendingInvites}
    />
  );
}
