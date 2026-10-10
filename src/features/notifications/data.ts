import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";

/**
 * Service-role data access for the sent log. Every function takes the admin client explicitly so
 * the RLS-bypass boundary stays visible at the call site (docs/SECURITY.md).
 */
type Admin = SupabaseClient<Database>;

export async function listDueLessonReminders(admin: Admin, from: Date, to: Date, limit: number) {
  const { data, error } = await admin.rpc("due_lesson_reminders", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_limit: limit,
  });
  if (error) throw new Error("Unable to list due lesson reminders.");
  return data ?? [];
}

export type ClaimResult = { claimed: true; id: string } | { claimed: false };

/**
 * Inserts the log row that claims a lesson reminder. The (kind, lesson_id) unique constraint
 * makes a second claim for the same lesson fail, which is what makes the cron job idempotent.
 */
export async function claimLessonReminder(
  admin: Admin,
  row: {
    tutorId: string;
    lessonId: string;
    studentId: string;
    toMasked: string | null;
    status: "pending" | "skipped";
    errorCode?: string;
  },
): Promise<ClaimResult> {
  const { data, error } = await admin
    .from("notification_log")
    .insert({
      tutor_id: row.tutorId,
      kind: "lesson_reminder",
      lesson_id: row.lessonId,
      student_id: row.studentId,
      to_email_masked: row.toMasked,
      status: row.status,
      error_code: row.errorCode ?? null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { claimed: false };
    throw new Error("Unable to write notification log.");
  }
  return { claimed: true, id: data.id };
}

export async function claimBalanceReminder(
  admin: Admin,
  tutorId: string,
  studentId: string,
  toMasked: string,
) {
  const { data, error } = await admin.rpc("claim_balance_reminder", {
    p_tutor_id: tutorId,
    p_student_id: studentId,
    p_to_masked: toMasked,
  });
  if (error) throw new Error("Unable to write notification log.");
  return data ?? null;
}

export async function finishLogEntry(
  admin: Admin,
  id: string,
  status: "sent" | "failed",
  errorCode?: string,
) {
  const { error } = await admin
    .from("notification_log")
    .update({ status, error_code: errorCode ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("Unable to update notification log.");
}

/** Removes a still-pending claim so a later run can retry (used after a 429, where nothing was sent). */
export async function releaseLogEntry(admin: Admin, id: string) {
  await admin.from("notification_log").delete().eq("id", id).eq("status", "pending");
}
