import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";

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

/**
 * Reads for the signed-in student, scoped through portal_list_lessons (see
 * supabase/migrations/20260917000000_portal_column_privacy.sql) so tutor-private lesson notes
 * never leave the database for a portal session.
 */
export async function listPortalLessons(
  supabase: SupabaseClient<Database>,
  range?: { start?: string; end?: string },
  limit = 200,
) {
  const { data, error } = await supabase.rpc("portal_list_lessons", {
    p_start: range?.start,
    p_end: range?.end,
    p_limit: limit,
  });

  if (error) throw new Error(`Unable to load lessons: ${error.message}`);
  return (data ?? []) as PortalLesson[];
}
