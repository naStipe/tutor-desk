import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import type { HomeworkInput } from "./schemas";

export type Homework = Database["public"]["Tables"]["homework"]["Row"];
export type HomeworkWithStudent = Homework & {
  student: { id: string; name: string } | null;
  lesson: { id: string; start_time: string } | null;
};

const HOMEWORK_COLUMNS =
  "id, tutor_id, student_id, lesson_id, title, description, due_date, status, submission_text, submitted_at, feedback_text, feedback_at, created_at, updated_at, student:student_id (id, name), lesson:lesson_id (id, start_time)";

export async function listHomework(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("homework")
    .select(HOMEWORK_COLUMNS)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load homework: ${error.message}`);
  return data as unknown as HomeworkWithStudent[];
}

export async function countHomeworkToReview(supabase: SupabaseClient<Database>) {
  const { count, error } = await supabase
    .from("homework")
    .select("id", { count: "exact", head: true })
    .eq("status", "submitted");

  if (error) throw new Error(`Unable to count homework to review: ${error.message}`);
  return count ?? 0;
}

export async function getHomework(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("homework")
    .select(HOMEWORK_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load homework: ${error.message}`);
  return data as unknown as HomeworkWithStudent | null;
}

export async function createHomework(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  input: HomeworkInput,
) {
  const { data, error } = await supabase
    .from("homework")
    .insert({
      tutor_id: tutorId,
      student_id: input.studentId,
      lesson_id: input.lessonId ?? null,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ?? null,
    })
    .select(HOMEWORK_COLUMNS)
    .single();

  if (error) throw new Error(`Unable to create homework: ${error.message}`);
  return data as unknown as HomeworkWithStudent;
}

export async function updateHomework(
  supabase: SupabaseClient<Database>,
  id: string,
  input: HomeworkInput,
) {
  const { data, error } = await supabase
    .from("homework")
    .update({
      student_id: input.studentId,
      lesson_id: input.lessonId ?? null,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(HOMEWORK_COLUMNS)
    .single();

  if (error) throw new Error(`Unable to update homework: ${error.message}`);
  return data as unknown as HomeworkWithStudent;
}

export async function recordSubmission(
  supabase: SupabaseClient<Database>,
  id: string,
  submissionText: string,
) {
  const { error } = await supabase
    .from("homework")
    .update({
      submission_text: submissionText,
      submitted_at: new Date().toISOString(),
      status: "submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(`Unable to record submission: ${error.message}`);
}

export async function recordFeedback(
  supabase: SupabaseClient<Database>,
  id: string,
  feedbackText: string,
) {
  const { error } = await supabase
    .from("homework")
    .update({
      feedback_text: feedbackText,
      feedback_at: new Date().toISOString(),
      status: "reviewed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(`Unable to record feedback: ${error.message}`);
}
