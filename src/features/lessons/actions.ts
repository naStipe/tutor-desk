"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { tutorTag } from "../../lib/query-cache";
import {
  cancelLessonSeries,
  createLesson,
  createLessonSeries,
  getFirstLessonForSeries,
  updateLesson,
  updateLessonPayment,
  updateLessonStatus,
  updateLessonTime,
} from "./data";
import { toDateParam } from "./date-utils";
import { ensureUpcomingLessonsGenerated } from "./recurrence";
import {
  lessonInputSchema,
  lessonStatusSchema,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  recurrenceInputSchema,
} from "./schemas";

export type LessonActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function fields(formData: FormData) {
  return {
    // A <select>'s currently-selected option being absent from submission (e.g. a disabled
    // placeholder) makes FormData.get return null rather than "" — normalize so validation
    // reports our friendly message instead of Zod's generic "expected string" one.
    studentId: formData.get("studentId") ?? "",
    subjectId: formData.get("subjectId"),
    startTime: formData.get("startTime"),
    durationMinutes: formData.get("durationMinutes"),
    notes: formData.get("notes"),
    meetingUrl: formData.get("meetingUrl"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    paymentStatus: formData.get("paymentStatus") ?? "unpaid",
    paymentMethod: formData.get("paymentMethod"),
  };
}

async function requireTutorId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/sign-in");
  return { supabase, tutorId: user.id };
}

/** Where the calendar should land, with the given lesson highlighted. */
function calendarHref(startTimeIso: string, lessonId: string) {
  const date = toDateParam(new Date(startTimeIso));
  return `/dashboard/schedule?view=day&date=${date}&highlight=${lessonId}`;
}

export async function createLessonAction(
  _state: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  const parsed = lessonInputSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const recurrence = recurrenceInputSchema.safeParse({
    repeat: formData.get("repeat"),
    repeatUntil: formData.get("repeatUntil"),
  });
  if (!recurrence.success) return { fieldErrors: recurrence.error.flatten().fieldErrors };

  const { supabase, tutorId } = await requireTutorId();

  let href: string;
  try {
    if (recurrence.data.repeat) {
      const start = new Date(parsed.data.startTime);
      const series = await createLessonSeries(supabase, tutorId, {
        studentId: parsed.data.studentId,
        subjectId: parsed.data.subjectId,
        dayOfWeek: start.getDay(),
        startMinutes: start.getHours() * 60 + start.getMinutes(),
        durationMinutes: parsed.data.durationMinutes,
        startDate: parsed.data.startTime.slice(0, 10),
        endDate: recurrence.data.repeatUntil,
        notes: parsed.data.notes,
      });
      await ensureUpcomingLessonsGenerated(supabase, tutorId);
      const firstLesson = await getFirstLessonForSeries(supabase, series.id);
      href = firstLesson
        ? calendarHref(firstLesson.start_time, firstLesson.id)
        : `/dashboard/schedule?view=day&date=${parsed.data.startTime.slice(0, 10)}`;
    } else {
      const lesson = await createLesson(supabase, tutorId, parsed.data);
      href = calendarHref(lesson.start_time, lesson.id);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to schedule lesson." };
  }

  revalidateTag(tutorTag("lessons", tutorId));
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard");
  redirect(href);
}

export async function updateLessonAction(
  _state: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return { error: "Missing lesson reference." };

  const parsed = lessonInputSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase, tutorId } = await requireTutorId();

  try {
    await updateLesson(supabase, id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update lesson." };
  }

  revalidateTag(tutorTag("lessons", tutorId));
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/schedule");
  revalidatePath(`/dashboard/lessons/${id}`);
  redirect(`/dashboard/lessons/${id}`);
}

export type CalendarActionResult = { error: string } | { id: string };

/** Reschedules a lesson by dragging it on the calendar. Duration is preserved by the caller. */
export async function moveLessonAction(
  id: string,
  startTime: string,
  endTime: string,
): Promise<CalendarActionResult> {
  if (typeof id !== "string" || !id) return { error: "Missing lesson reference." };
  if (Number.isNaN(Date.parse(startTime)) || Number.isNaN(Date.parse(endTime))) {
    return { error: "Invalid lesson time." };
  }
  if (new Date(endTime) <= new Date(startTime)) {
    return { error: "End time must be after start time." };
  }

  const { supabase, tutorId } = await requireTutorId();

  try {
    const lesson = await updateLessonTime(supabase, id, startTime, endTime);
    revalidateTag(tutorTag("lessons", tutorId));
    revalidatePath("/dashboard/lessons");
    revalidatePath("/dashboard/schedule");
    return { id: lesson.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to move lesson." };
  }
}

export async function updateLessonStatusAction(id: string, status: string) {
  const parsedStatus = lessonStatusSchema.safeParse(status);
  if (typeof id !== "string" || id === "" || !parsedStatus.success) {
    throw new Error("Missing or invalid lesson status update.");
  }

  const { supabase, tutorId } = await requireTutorId();
  await updateLessonStatus(supabase, id, parsedStatus.data);

  revalidateTag(tutorTag("lessons", tutorId));
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/schedule");
  revalidatePath(`/dashboard/lessons/${id}`);
  revalidatePath("/dashboard");
}

/** @deprecated form-action wrapper kept only for any lingering non-JS form submissions. */
export async function setLessonStatusAction(formData: FormData) {
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || id === "" || typeof status !== "string") {
    throw new Error("Missing or invalid lesson status update.");
  }
  await updateLessonStatusAction(id, status);
  redirect(`/dashboard/lessons/${id}`);
}

export async function setLessonPaymentAction(formData: FormData) {
  const id = formData.get("id");
  const status = PAYMENT_STATUSES.find((value) => value === formData.get("paymentStatus"));
  const methodRaw = formData.get("paymentMethod");
  const method = PAYMENT_METHODS.find((value) => value === methodRaw) ?? null;

  if (typeof id !== "string" || id === "" || !status) {
    throw new Error("Missing or invalid payment update.");
  }

  const { supabase, tutorId } = await requireTutorId();
  await updateLessonPayment(supabase, id, status, method);

  revalidateTag(tutorTag("lessons", tutorId));
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/schedule");
  revalidatePath(`/dashboard/lessons/${id}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/lessons/${id}`);
}

export async function cancelSeriesAction(formData: FormData) {
  const seriesId = formData.get("seriesId");
  const lessonId = formData.get("lessonId");
  if (typeof seriesId !== "string" || seriesId === "") {
    throw new Error("Missing recurring lesson reference.");
  }

  const { supabase, tutorId } = await requireTutorId();
  await cancelLessonSeries(supabase, seriesId);

  revalidateTag(tutorTag("lessons", tutorId));
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard");
  if (typeof lessonId === "string" && lessonId !== "") {
    revalidatePath(`/dashboard/lessons/${lessonId}`);
    redirect(`/dashboard/lessons/${lessonId}`);
  }
  redirect("/dashboard/lessons");
}
