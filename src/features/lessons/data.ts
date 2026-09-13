import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import type { LessonInput, LessonStatus } from "./schemas";

export type Lesson = Database["public"]["Tables"]["lesson"]["Row"];
export type LessonWithStudent = Lesson & { student: { id: string; name: string } | null };

const LESSON_COLUMNS =
  "id, tutor_id, student_id, start_time, end_time, status, notes, created_at, updated_at, student:student_id (id, name)";

export async function listLessonsInRange(
  supabase: SupabaseClient<Database>,
  range: { start: string; end: string },
) {
  const { data, error } = await supabase
    .from("lesson")
    .select(LESSON_COLUMNS)
    .gte("start_time", range.start)
    .lt("start_time", range.end)
    .order("start_time", { ascending: true });

  if (error) throw new Error(`Unable to load lessons: ${error.message}`);
  return data as unknown as LessonWithStudent[];
}

export async function listUpcomingLessons(supabase: SupabaseClient<Database>, limit = 5) {
  const { data, error } = await supabase
    .from("lesson")
    .select(LESSON_COLUMNS)
    .eq("status", "scheduled")
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Unable to load upcoming lessons: ${error.message}`);
  return data as unknown as LessonWithStudent[];
}

export async function countUpcomingLessons(supabase: SupabaseClient<Database>) {
  const { count, error } = await supabase
    .from("lesson")
    .select("id", { count: "exact", head: true })
    .eq("status", "scheduled")
    .gte("start_time", new Date().toISOString());

  if (error) throw new Error(`Unable to count upcoming lessons: ${error.message}`);
  return count ?? 0;
}

export async function getLesson(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("lesson")
    .select(LESSON_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load lesson: ${error.message}`);
  return data as unknown as LessonWithStudent | null;
}

export async function createLesson(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  input: LessonInput,
) {
  const { data, error } = await supabase
    .from("lesson")
    .insert({
      tutor_id: tutorId,
      student_id: input.studentId,
      start_time: input.startTime,
      end_time: input.endTime,
      notes: input.notes ?? null,
    })
    .select(LESSON_COLUMNS)
    .single();

  if (error) throw new Error(`Unable to schedule lesson: ${error.message}`);
  return data as unknown as LessonWithStudent;
}

export async function updateLesson(
  supabase: SupabaseClient<Database>,
  id: string,
  input: LessonInput,
) {
  const { data, error } = await supabase
    .from("lesson")
    .update({
      student_id: input.studentId,
      start_time: input.startTime,
      end_time: input.endTime,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(LESSON_COLUMNS)
    .single();

  if (error) throw new Error(`Unable to update lesson: ${error.message}`);
  return data as unknown as LessonWithStudent;
}

export async function updateLessonStatus(
  supabase: SupabaseClient<Database>,
  id: string,
  status: LessonStatus,
) {
  const { error } = await supabase
    .from("lesson")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Unable to update lesson status: ${error.message}`);
}
