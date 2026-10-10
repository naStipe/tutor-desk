import { handleCronRequest } from "../../../../features/notifications/cron-handler";
import { runLessonReminders } from "../../../../features/notifications/send-lesson-reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Sends are spaced ~600ms apart (Resend rate limit); 40 sends need ~25s.
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    return await handleCronRequest(request, (config) => runLessonReminders(config));
  } catch {
    return Response.json({ error: "Lesson reminder run failed." }, { status: 500 });
  }
}
