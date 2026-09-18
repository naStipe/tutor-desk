import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import type { LessonInput, LessonStatus, PaymentMethod, PaymentStatus } from "./schemas";

export type Lesson = Database["public"]["Tables"]["lesson"]["Row"];
export type LessonSeries = Database["public"]["Tables"]["lesson_series"]["Row"];
export type LessonWithStudent = Lesson & {
  student: { id: string; name: string } | null;
  subject: { id: string; name: string } | null;
};

const LESSON_COLUMNS =
  "id, tutor_id, student_id, subject_id, series_id, start_time, end_time, status, notes, meeting_url, price, currency, payment_status, payment_method, paid_at, created_at, updated_at, student:student_id (id, name), subject:subject_id (id, name)";

function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

/** Postgres exclusion_violation, raised by the (tutor_id, time range) no-overlap constraint. */
const CONFLICT_ERROR_CODE = "23P01";
/** Postgres unique_violation, raised by the (series_id, start_time) no-duplicate constraint. */
const DUPLICATE_ERROR_CODE = "23505";

function lessonWriteErrorMessage(error: { code?: string; message: string }, fallback: string) {
  if (error.code === CONFLICT_ERROR_CODE) {
    return "This time overlaps another lesson. Choose a different time.";
  }
  return `${fallback}: ${error.message}`;
}

export async function listLessonsInRange(
  supabase: SupabaseClient<Database>,
  range: { start: string; end: string },
  filters?: { studentId?: string },
) {
  let query = supabase
    .from("lesson")
    .select(LESSON_COLUMNS)
    .gte("start_time", range.start)
    .lt("start_time", range.end)
    .order("start_time", { ascending: true });

  if (filters?.studentId) query = query.eq("student_id", filters.studentId);

  const { data, error } = await query;

  if (error) throw new Error(`Unable to load lessons: ${error.message}`);
  return data as unknown as LessonWithStudent[];
}

/**
 * Minimal lesson times used to check upcoming lessons against a candidate working-hours change,
 * before it's saved — cancelled lessons are excluded since they no longer occupy a time slot.
 */
export async function listUpcomingLessonTimes(supabase: SupabaseClient<Database>, fromIso: string) {
  const { data, error } = await supabase
    .from("lesson")
    .select("id, start_time, end_time")
    .gte("start_time", fromIso)
    .neq("status", "cancelled");

  if (error) throw new Error(`Unable to load lessons: ${error.message}`);
  return data;
}

export async function listLessonSlotsInRange(
  supabase: SupabaseClient<Database>,
  range: { start: string; end: string },
) {
  const { data, error } = await supabase
    .from("lesson")
    .select("id, start_time, end_time, status")
    .gte("start_time", range.start)
    .lt("start_time", range.end)
    .order("start_time", { ascending: true });

  if (error) throw new Error(`Unable to load lessons: ${error.message}`);
  return data;
}

export async function listLessonsForSelect(supabase: SupabaseClient<Database>, limit = 100) {
  const { data, error } = await supabase
    .from("lesson")
    .select(LESSON_COLUMNS)
    .order("start_time", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Unable to load lessons: ${error.message}`);
  return data as unknown as LessonWithStudent[];
}

export async function listLessonsForStudent(
  supabase: SupabaseClient<Database>,
  studentId: string,
  limit = 200,
) {
  const { data, error } = await supabase
    .from("lesson")
    .select(LESSON_COLUMNS)
    .eq("student_id", studentId)
    .order("start_time", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Unable to load lessons: ${error.message}`);
  return data as unknown as LessonWithStudent[];
}

export type LessonListSortKey = "date" | "student" | "subject" | "status";

const LESSON_SORT_COLUMNS: Record<LessonListSortKey, { column: string; foreignTable?: string }> = {
  date: { column: "start_time" },
  student: { column: "name", foreignTable: "student" },
  subject: { column: "name", foreignTable: "subject" },
  status: { column: "status" },
};

export async function listLessonsPage(
  supabase: SupabaseClient<Database>,
  options: {
    status?: LessonStatus;
    studentId?: string;
    subjectId?: string;
    sortKey?: LessonListSortKey;
    sortDir?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  } = {},
) {
  const {
    status,
    studentId,
    subjectId,
    sortKey = "date",
    sortDir = "desc",
    page = 1,
    pageSize = 50,
  } = options;

  let query = supabase.from("lesson").select(LESSON_COLUMNS, { count: "exact" });

  if (status) query = query.eq("status", status);
  if (studentId) query = query.eq("student_id", studentId);
  if (subjectId) query = query.eq("subject_id", subjectId);

  const sort = LESSON_SORT_COLUMNS[sortKey];
  const ascending = sortDir === "asc";
  query = sort.foreignTable
    ? query.order(sort.column, { ascending, foreignTable: sort.foreignTable })
    : query.order(sort.column, { ascending });
  if (sortKey !== "date") query = query.order("start_time", { ascending: false });

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);

  if (error) throw new Error(`Unable to load lessons: ${error.message}`);
  return { lessons: data as unknown as LessonWithStudent[], totalCount: count ?? 0 };
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
  seriesId?: string,
) {
  const { data, error } = await supabase
    .from("lesson")
    .insert({
      tutor_id: tutorId,
      student_id: input.studentId,
      subject_id: input.subjectId ?? null,
      series_id: seriesId ?? null,
      start_time: input.startTime,
      end_time: addMinutes(input.startTime, input.durationMinutes),
      notes: input.notes ?? null,
      meeting_url: input.meetingUrl ?? null,
      price: input.price ?? null,
      currency: input.currency ?? null,
      payment_status: input.paymentStatus,
      payment_method: input.paymentMethod ?? null,
      paid_at: input.paymentStatus === "paid" ? new Date().toISOString() : null,
    })
    .select(LESSON_COLUMNS)
    .single();

  if (error) throw new Error(lessonWriteErrorMessage(error, "Unable to schedule lesson"));
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
      subject_id: input.subjectId ?? null,
      start_time: input.startTime,
      end_time: addMinutes(input.startTime, input.durationMinutes),
      notes: input.notes ?? null,
      meeting_url: input.meetingUrl ?? null,
      price: input.price ?? null,
      currency: input.currency ?? null,
      payment_status: input.paymentStatus,
      payment_method: input.paymentMethod ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(LESSON_COLUMNS)
    .single();

  if (error) throw new Error(lessonWriteErrorMessage(error, "Unable to update lesson"));
  return data as unknown as LessonWithStudent;
}

export async function updateLessonTime(
  supabase: SupabaseClient<Database>,
  id: string,
  startTime: string,
  endTime: string,
) {
  const { data, error } = await supabase
    .from("lesson")
    .update({ start_time: startTime, end_time: endTime, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(LESSON_COLUMNS)
    .single();

  if (error) throw new Error(lessonWriteErrorMessage(error, "Unable to move lesson"));
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

export async function updateLessonPayment(
  supabase: SupabaseClient<Database>,
  id: string,
  paymentStatus: PaymentStatus,
  paymentMethod: PaymentMethod | null,
) {
  const { error } = await supabase
    .from("lesson")
    .update({
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(`Unable to update lesson payment: ${error.message}`);
}

export async function cancelScheduledLessonsForStudent(
  supabase: SupabaseClient<Database>,
  studentId: string,
) {
  const { error } = await supabase
    .from("lesson")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .eq("status", "scheduled");

  if (error) throw new Error(`Unable to cancel lessons: ${error.message}`);
}

export async function createLessonSeries(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  input: {
    studentId: string;
    subjectId?: string;
    dayOfWeek: number;
    startMinutes: number;
    durationMinutes: number;
    startDate: string;
    endDate?: string;
    notes?: string;
  },
) {
  const { data, error } = await supabase
    .from("lesson_series")
    .insert({
      tutor_id: tutorId,
      student_id: input.studentId,
      subject_id: input.subjectId ?? null,
      day_of_week: input.dayOfWeek,
      start_minutes: input.startMinutes,
      duration_minutes: input.durationMinutes,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Unable to schedule recurring lesson: ${error.message}`);
  return data;
}

export async function getFirstLessonForSeries(
  supabase: SupabaseClient<Database>,
  seriesId: string,
) {
  const { data, error } = await supabase
    .from("lesson")
    .select("id, start_time")
    .eq("series_id", seriesId)
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Unable to load recurring lesson: ${error.message}`);
  return data;
}

export async function cancelLessonSeries(supabase: SupabaseClient<Database>, id: string) {
  const { data: series, error: fetchError } = await supabase
    .from("lesson_series")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw new Error(`Unable to load recurring lesson: ${fetchError.message}`);
  if (!series) return;

  const { error: seriesError } = await supabase
    .from("lesson_series")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (seriesError) throw new Error(`Unable to cancel recurring lesson: ${seriesError.message}`);

  const { error: lessonError } = await supabase
    .from("lesson")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("series_id", id)
    .eq("status", "scheduled")
    .gte("start_time", new Date().toISOString());
  if (lessonError) throw new Error(`Unable to cancel upcoming lessons: ${lessonError.message}`);
}

export async function listActiveLessonSeriesForGeneration(
  supabase: SupabaseClient<Database>,
  horizon: string,
) {
  const { data, error } = await supabase
    .from("lesson_series")
    .select("*")
    .eq("status", "active")
    .lt("generated_until", horizon);

  if (error) throw new Error(`Unable to load recurring lessons: ${error.message}`);
  return data;
}

export async function insertGeneratedLessons(
  supabase: SupabaseClient<Database>,
  rows: {
    tutorId: string;
    studentId: string;
    subjectId: string | null;
    seriesId: string;
    startTime: string;
    endTime: string;
    price: number | null;
    currency: string | null;
  }[],
) {
  if (rows.length === 0) return;
  const payload = rows.map((row) => ({
    tutor_id: row.tutorId,
    student_id: row.studentId,
    subject_id: row.subjectId,
    series_id: row.seriesId,
    start_time: row.startTime,
    end_time: row.endTime,
    price: row.price,
    currency: row.currency,
  }));
  const { error } = await supabase.from("lesson").insert(payload);
  if (!error) return;
  if (error.code !== CONFLICT_ERROR_CODE && error.code !== DUPLICATE_ERROR_CODE) {
    throw new Error(`Unable to generate recurring lessons: ${error.message}`);
  }

  // One occurrence overlapping an unrelated lesson, or one a concurrent request already
  // generated, shouldn't block the rest of the series: fall back to inserting one at a time and
  // skip whichever rows conflict.
  for (const row of payload) {
    const { error: rowError } = await supabase.from("lesson").insert(row);
    if (
      rowError &&
      rowError.code !== CONFLICT_ERROR_CODE &&
      rowError.code !== DUPLICATE_ERROR_CODE
    ) {
      throw new Error(`Unable to generate recurring lessons: ${rowError.message}`);
    }
  }
}

export async function updateSeriesGeneratedUntil(
  supabase: SupabaseClient<Database>,
  id: string,
  generatedUntil: string,
) {
  const { error } = await supabase
    .from("lesson_series")
    .update({ generated_until: generatedUntil, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Unable to update recurring lesson: ${error.message}`);
}
