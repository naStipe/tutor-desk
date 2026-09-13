import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import type { StudentInput } from "./schemas";

export type Student = Database["public"]["Tables"]["student"]["Row"];

const STUDENT_COLUMNS = "id, tutor_id, name, email, notes, archived_at, created_at, updated_at";

export async function listActiveStudents(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("student")
    .select(STUDENT_COLUMNS)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(`Unable to load students: ${error.message}`);
  return data;
}

export async function getStudent(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("student")
    .select(STUDENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load student: ${error.message}`);
  return data;
}

export async function createStudent(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  input: StudentInput,
) {
  const { data, error } = await supabase
    .from("student")
    .insert({
      tutor_id: tutorId,
      name: input.name,
      email: input.email ?? null,
      notes: input.notes ?? null,
    })
    .select(STUDENT_COLUMNS)
    .single();

  if (error) throw new Error(`Unable to create student: ${error.message}`);
  return data;
}

export async function updateStudent(
  supabase: SupabaseClient<Database>,
  id: string,
  input: StudentInput,
) {
  const { data, error } = await supabase
    .from("student")
    .update({
      name: input.name,
      email: input.email ?? null,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(STUDENT_COLUMNS)
    .single();

  if (error) throw new Error(`Unable to update student: ${error.message}`);
  return data;
}

export async function archiveStudent(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase
    .from("student")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Unable to archive student: ${error.message}`);
}
