import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import type { SubjectInput } from "./schemas";

export type Subject = Database["public"]["Tables"]["subject"]["Row"];

const SUBJECT_COLUMNS = "id, tutor_id, name, created_at";

export async function listSubjects(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("subject")
    .select(SUBJECT_COLUMNS)
    .order("name", { ascending: true });

  if (error) throw new Error(`Unable to load subjects: ${error.message}`);
  return data;
}

export async function createSubject(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  input: SubjectInput,
) {
  const { data, error } = await supabase
    .from("subject")
    .insert({ tutor_id: tutorId, name: input.name })
    .select(SUBJECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("You already have a subject with that name.");
    throw new Error(`Unable to create subject: ${error.message}`);
  }
  return data;
}

export async function deleteSubject(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase.from("subject").delete().eq("id", id);
  if (error) throw new Error(`Unable to delete subject: ${error.message}`);
}
