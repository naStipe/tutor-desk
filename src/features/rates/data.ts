import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import type { RateInput } from "./schemas";

export type StudentSubjectRate = Database["public"]["Tables"]["student_subject_rate"]["Row"];
export type RateWithSubject = StudentSubjectRate & { subject: { id: string; name: string } | null };

const RATE_COLUMNS =
  "id, tutor_id, student_id, subject_id, hourly_rate, currency, created_at, updated_at, subject:subject_id (id, name)";

export async function listRatesForStudent(supabase: SupabaseClient<Database>, studentId: string) {
  const { data, error } = await supabase
    .from("student_subject_rate")
    .select(RATE_COLUMNS)
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Unable to load rates: ${error.message}`);
  return data as unknown as RateWithSubject[];
}

/** Flat rate rows for every student, used to auto-fill a lesson's price when scheduling. */
export async function listRatesForTutor(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("student_subject_rate")
    .select("student_id, subject_id, hourly_rate, currency");

  if (error) throw new Error(`Unable to load rates: ${error.message}`);
  return data;
}

export async function getRate(
  supabase: SupabaseClient<Database>,
  studentId: string,
  subjectId: string,
) {
  const { data, error } = await supabase
    .from("student_subject_rate")
    .select("hourly_rate, currency")
    .eq("student_id", studentId)
    .eq("subject_id", subjectId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load rate: ${error.message}`);
  return data;
}

export async function upsertRate(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  input: RateInput,
) {
  const { data, error } = await supabase
    .from("student_subject_rate")
    .upsert(
      {
        tutor_id: tutorId,
        student_id: input.studentId,
        subject_id: input.subjectId,
        hourly_rate: input.hourlyRate,
        currency: input.currency,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,subject_id" },
    )
    .select(RATE_COLUMNS)
    .single();

  if (error) throw new Error(`Unable to save rate: ${error.message}`);
  return data as unknown as RateWithSubject;
}

export async function deleteRate(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase.from("student_subject_rate").delete().eq("id", id);
  if (error) throw new Error(`Unable to delete rate: ${error.message}`);
}
