import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import type { HomeworkInput } from "./schemas";

export type Homework = Database["public"]["Tables"]["homework"]["Row"];
export type HomeworkAttachment = Database["public"]["Tables"]["homework_attachment"]["Row"];
export type HomeworkWithStudent = Homework & {
  student: { id: string; name: string } | null;
  lesson: { id: string; start_time: string } | null;
  subject: { id: string; name: string } | null;
};

const HOMEWORK_COLUMNS =
  "id, tutor_id, student_id, lesson_id, subject_id, links, title, description, due_date, status, submission_text, submitted_at, feedback_text, feedback_at, created_at, updated_at, student:student_id (id, name), lesson:lesson_id (id, start_time), subject:subject_id (id, name)";

export async function listHomework(
  supabase: SupabaseClient<Database>,
  filters?: { studentId?: string; subjectId?: string },
) {
  let query = supabase
    .from("homework")
    .select(HOMEWORK_COLUMNS)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filters?.studentId) query = query.eq("student_id", filters.studentId);
  if (filters?.subjectId) query = query.eq("subject_id", filters.subjectId);

  const { data, error } = await query;

  if (error) throw new Error(`Unable to load homework: ${error.message}`);
  return data as unknown as HomeworkWithStudent[];
}

export async function listHomeworkDueInRange(
  supabase: SupabaseClient<Database>,
  range: { start: string; end: string },
  filters?: { studentId?: string },
) {
  let query = supabase
    .from("homework")
    .select(HOMEWORK_COLUMNS)
    .gte("due_date", range.start)
    .lt("due_date", range.end)
    .order("due_date", { ascending: true });

  if (filters?.studentId) query = query.eq("student_id", filters.studentId);

  const { data, error } = await query;

  if (error) throw new Error(`Unable to load homework: ${error.message}`);
  return data as unknown as HomeworkWithStudent[];
}

/** Submitted work, not yet reviewed, grouped by the day it was submitted. */
export async function listHomeworkAwaitingReviewInRange(
  supabase: SupabaseClient<Database>,
  range: { start: string; end: string },
  filters?: { studentId?: string },
) {
  let query = supabase
    .from("homework")
    .select(HOMEWORK_COLUMNS)
    .eq("status", "submitted")
    .gte("submitted_at", range.start)
    .lt("submitted_at", range.end)
    .order("submitted_at", { ascending: true });

  if (filters?.studentId) query = query.eq("student_id", filters.studentId);

  const { data, error } = await query;

  if (error) throw new Error(`Unable to load homework awaiting review: ${error.message}`);
  return data as unknown as HomeworkWithStudent[];
}

export async function listHomeworkForLesson(supabase: SupabaseClient<Database>, lessonId: string) {
  const { data, error } = await supabase
    .from("homework")
    .select(HOMEWORK_COLUMNS)
    .eq("lesson_id", lessonId)
    .order("due_date", { ascending: true, nullsFirst: false });

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

/** Submitted work waiting for feedback, plus assigned work already past its due date. */
export async function countHomeworkNeedingAttention(supabase: SupabaseClient<Database>) {
  const nowIso = new Date().toISOString();
  const [submitted, overdue] = await Promise.all([
    supabase
      .from("homework")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("homework")
      .select("id", { count: "exact", head: true })
      .eq("status", "assigned")
      .lt("due_date", nowIso),
  ]);

  if (submitted.error)
    throw new Error(`Unable to count homework to review: ${submitted.error.message}`);
  if (overdue.error) throw new Error(`Unable to count overdue homework: ${overdue.error.message}`);
  return (submitted.count ?? 0) + (overdue.count ?? 0);
}

/** The rows that power the Today dashboard's "Needs review" card. */
export async function listHomeworkNeedingAttention(supabase: SupabaseClient<Database>, limit = 5) {
  const nowIso = new Date().toISOString();
  const [submitted, overdue] = await Promise.all([
    supabase
      .from("homework")
      .select(HOMEWORK_COLUMNS)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true })
      .limit(limit),
    supabase
      .from("homework")
      .select(HOMEWORK_COLUMNS)
      .eq("status", "assigned")
      .lt("due_date", nowIso)
      .order("due_date", { ascending: true })
      .limit(limit),
  ]);

  if (submitted.error)
    throw new Error(`Unable to load homework to review: ${submitted.error.message}`);
  if (overdue.error) throw new Error(`Unable to load overdue homework: ${overdue.error.message}`);

  const rows = [
    ...(submitted.data as unknown as HomeworkWithStudent[]).map((row) => ({
      homework: row,
      overdue: false as const,
    })),
    ...(overdue.data as unknown as HomeworkWithStudent[]).map((row) => ({
      homework: row,
      overdue: true as const,
    })),
  ];
  return rows.slice(0, limit);
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
      subject_id: input.subjectId ?? null,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ?? null,
      links: input.links,
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
      subject_id: input.subjectId ?? null,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ?? null,
      links: input.links,
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

export const HOMEWORK_ATTACHMENTS_BUCKET = "homework-attachments";

export async function listAttachments(supabase: SupabaseClient<Database>, homeworkId: string) {
  const { data, error } = await supabase
    .from("homework_attachment")
    .select(
      "id, homework_id, tutor_id, storage_path, file_name, content_type, size_bytes, created_at",
    )
    .eq("homework_id", homeworkId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Unable to load attachments: ${error.message}`);
  return data;
}

export async function createAttachment(
  supabase: SupabaseClient<Database>,
  input: {
    tutorId: string;
    homeworkId: string;
    storagePath: string;
    fileName: string;
    contentType: string | null;
    sizeBytes: number | null;
  },
) {
  const { error } = await supabase.from("homework_attachment").insert({
    tutor_id: input.tutorId,
    homework_id: input.homeworkId,
    storage_path: input.storagePath,
    file_name: input.fileName,
    content_type: input.contentType,
    size_bytes: input.sizeBytes,
  });

  if (error) throw new Error(`Unable to save attachment: ${error.message}`);
}

export async function deleteAttachment(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("homework_attachment")
    .delete()
    .eq("id", id)
    .select("storage_path")
    .maybeSingle();

  if (error) throw new Error(`Unable to delete attachment: ${error.message}`);
  return data;
}

export async function getSignedAttachmentUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string,
) {
  const { data, error } = await supabase.storage
    .from(HOMEWORK_ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 10);

  if (error) throw new Error(`Unable to create download link: ${error.message}`);
  return data.signedUrl;
}
