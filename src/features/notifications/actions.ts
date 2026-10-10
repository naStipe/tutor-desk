"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "../../lib/supabase/admin";
import { createClient } from "../../lib/supabase/server";
import { getStudent, getStudentUnpaidSummary } from "../students/data";
import { getTutorProfile } from "../tutor-profile/data";
import { canSendEmail, getNotificationConfig } from "./config";
import { claimBalanceReminder, finishLogEntry } from "./data";
import { buildBalanceReminderEmail } from "./email-content";
import { sendEmail } from "./resend";
import { maskEmail, pickRecipient, sendBalanceReminderSchema } from "./schemas";

export type BalanceReminderState = { error?: string; message?: string };

const GENERIC_ERROR = "Unable to send the reminder. Please try again later.";

async function requireTutorId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/sign-in");
  return { supabase, tutorId: user.id };
}

export async function sendBalanceReminderAction(
  _state: BalanceReminderState,
  formData: FormData,
): Promise<BalanceReminderState> {
  const { supabase, tutorId } = await requireTutorId();

  const config = getNotificationConfig();
  if (!canSendEmail(config) || !config.apiKey || !config.from) {
    return { error: "Email notifications are not enabled." };
  }

  const parsed = sendBalanceReminderSchema.safeParse({ studentId: formData.get("studentId") });
  if (!parsed.success) return { error: GENERIC_ERROR };

  try {
    // IDOR: the student id comes from the browser, so load it through the tutor's own RLS-scoped
    // client AND re-check ownership explicitly. Everything below derives from this row.
    const student = await getStudent(supabase, parsed.data.studentId);
    if (!student || student.tutor_id !== tutorId) return { error: GENERIC_ERROR };

    const totals = await getStudentUnpaidSummary(supabase, student.id);
    if (totals.length === 0) return { error: "This student has no unpaid balance." };

    const recipient = pickRecipient(student.guardian_email, student.email);
    if (!recipient) return { error: "This student has no email address on file." };

    const profile = await getTutorProfile(supabase, tutorId);

    const admin = createAdminClient();
    const logId = await claimBalanceReminder(admin, tutorId, student.id, maskEmail(recipient));
    if (!logId) {
      return { error: "A reminder was already sent for this student recently. Try again later." };
    }

    const content = buildBalanceReminderEmail({
      studentName: student.name,
      tutorName: profile?.name ?? null,
      totals,
      paymentInstructions: profile?.payment_instructions ?? null,
      tutorContactEmail: profile?.contact_email ?? null,
      locale: profile?.locale ?? "en-US",
    });
    const result = await sendEmail(config.apiKey, {
      from: config.from,
      to: recipient,
      subject: content.subject,
      html: content.html,
      text: content.text,
      idempotencyKey: `balance-reminder/${logId}`,
    });

    if (!result.ok) {
      await finishLogEntry(admin, logId, "failed", result.code);
      return { error: GENERIC_ERROR };
    }
    await finishLogEntry(admin, logId, "sent");
    return { message: `Reminder sent to ${maskEmail(recipient)}.` };
  } catch {
    return { error: GENERIC_ERROR };
  }
}
