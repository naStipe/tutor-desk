import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import { listActiveStudents } from "../students/data";

export async function resolveViewedStudent(
  supabase: SupabaseClient<Database>,
  requestedId: string | undefined,
) {
  const students = await listActiveStudents(supabase);
  const selected = requestedId ? students.find((student) => student.id === requestedId) : undefined;
  return { students, selected: selected ?? students[0] ?? null };
}
