import { createAdminClient } from "../../lib/supabase/admin";
import type { NotificationConfig } from "./config";
import {
  claimLessonReminder,
  finishLogEntry,
  listDueLessonReminders,
  releaseLogEntry,
} from "./data";
import { buildLessonReminderEmail } from "./email-content";
import { getReminderWindow, MAX_REMINDERS_PER_RUN } from "./reminder-window";
import { sendEmail } from "./resend";
import { maskEmail, pickRecipient } from "./schemas";

export type LessonReminderSummary = {
  due: number;
  sent: number;
  skipped: number;
  failed: number;
  alreadyHandled: number;
  stoppedEarly: "rate_limited" | null;
};

// Resend's default limit is 2 requests per second; stay under it.
const SEND_SPACING_MS = 600;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends reminders for scheduled lessons starting within the reminder window. Idempotent: the log
 * row is claimed (unique per lesson) BEFORE sending, so overlapping or repeated runs never send
 * the same reminder twice. A Resend failure marks only that lesson failed and the run continues;
 * a 429 releases the claim and stops the run so the next run retries the rest.
 */
export async function runLessonReminders(
  config: NotificationConfig,
  now = new Date(),
): Promise<LessonReminderSummary> {
  const summary: LessonReminderSummary = {
    due: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    alreadyHandled: 0,
    stoppedEarly: null,
  };
  if (!config.apiKey || !config.from) return summary;

  const admin = createAdminClient();
  const { from, to } = getReminderWindow(now);
  const due = await listDueLessonReminders(admin, from, to, MAX_REMINDERS_PER_RUN);
  summary.due = due.length;

  let sentAny = false;
  for (const row of due) {
    const recipient = pickRecipient(row.student_email, row.guardian_email);
    const base = { tutorId: row.tutor_id, lessonId: row.lesson_id, studentId: row.student_id };

    if (!recipient) {
      const claim = await claimLessonReminder(admin, {
        ...base,
        toMasked: null,
        status: "skipped",
        errorCode: "no_email",
      });
      if (claim.claimed) summary.skipped += 1;
      else summary.alreadyHandled += 1;
      continue;
    }

    const claim = await claimLessonReminder(admin, {
      ...base,
      toMasked: maskEmail(recipient),
      status: "pending",
    });
    if (!claim.claimed) {
      summary.alreadyHandled += 1;
      continue;
    }

    if (sentAny) await sleep(SEND_SPACING_MS);
    sentAny = true;

    const content = buildLessonReminderEmail({
      studentName: row.student_name,
      tutorName: row.tutor_name,
      startIso: row.start_time,
      endIso: row.end_time,
      subjectName: row.subject_name,
      meetingUrl: row.meeting_url,
      timeZone: row.tutor_timezone,
      locale: row.tutor_locale,
    });
    const result = await sendEmail(config.apiKey, {
      from: config.from,
      to: recipient,
      subject: content.subject,
      html: content.html,
      text: content.text,
      idempotencyKey: `lesson-reminder/${row.lesson_id}`,
    });

    if (result.ok) {
      await finishLogEntry(admin, claim.id, "sent");
      summary.sent += 1;
    } else if (result.rateLimited) {
      await releaseLogEntry(admin, claim.id);
      summary.stoppedEarly = "rate_limited";
      break;
    } else {
      await finishLogEntry(admin, claim.id, "failed", result.code);
      summary.failed += 1;
    }
  }
  return summary;
}
