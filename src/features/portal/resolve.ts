import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { Database } from "../../lib/supabase/database.types";
import { listPortalStudents } from "./data";

/**
 * The student this portal session is viewing: the one matching `studentId` if the signed-in
 * user has access to it, otherwise their first accessible student. Redirects to sign-in if they
 * have no portal access at all (a parent may see several students; a linked learner sees one).
 */
export async function requirePortalStudent(supabase: SupabaseClient<Database>, studentId?: string) {
  const students = await listPortalStudents(supabase);
  if (students.length === 0) redirect("/sign-in");
  return students.find((student) => student.id === studentId) ?? students[0];
}
