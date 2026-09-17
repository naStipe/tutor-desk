import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";

export type PortalRole = "learner" | "guardian" | "payer";

export type PortalStudent = {
  id: string;
  name: string;
  tutor_id: string;
  role: PortalRole;
};

export type PortalLesson = {
  id: string;
  student_id: string;
  subject_id: string | null;
  subject_name: string | null;
  start_time: string;
  end_time: string;
  status: string;
  meeting_url: string | null;
  price: number | null;
  currency: string | null;
  payment_status: string;
  payment_method: string | null;
  paid_at: string | null;
};

/** Every student this signed-in user can see in the portal, and their role for each. */
export async function listPortalStudents(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("portal_list_students");
  if (error) throw new Error(`Unable to load your student profile: ${error.message}`);
  return (data ?? []) as PortalStudent[];
}

/**
 * Reads for one student this signed-in user has portal access to, scoped through
 * portal_list_lessons (see supabase/migrations/20260917000100_portal_membership.sql) so
 * tutor-private lesson notes never leave the database for a portal session.
 */
export async function listPortalLessons(
  supabase: SupabaseClient<Database>,
  studentId: string,
  range?: { start?: string; end?: string },
  limit = 200,
  offset = 0,
) {
  const { data, error } = await supabase.rpc("portal_list_lessons", {
    p_student_id: studentId,
    p_start: range?.start,
    p_end: range?.end,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw new Error(`Unable to load lessons: ${error.message}`);
  return (data ?? []) as PortalLesson[];
}

export async function countPortalLessons(
  supabase: SupabaseClient<Database>,
  studentId: string,
  range?: { start?: string; end?: string },
) {
  const { data, error } = await supabase.rpc("portal_count_lessons", {
    p_student_id: studentId,
    p_start: range?.start,
    p_end: range?.end,
  });

  if (error) throw new Error(`Unable to count lessons: ${error.message}`);
  return data ?? 0;
}
