"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { tutorTag } from "../../lib/query-cache";
import { createLesson, updateLesson, updateLessonStatus, updateLessonTime } from "./data";
import { lessonInputSchema, lessonStatusSchema } from "./schemas";

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
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    notes: formData.get("notes"),
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

export async function createLessonAction(
  _state: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  const parsed = lessonInputSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase, tutorId } = await requireTutorId();

  let lesson: Awaited<ReturnType<typeof createLesson>>;
  try {
    lesson = await createLesson(supabase, tutorId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to schedule lesson." };
  }

  revalidateTag(tutorTag("lessons", tutorId));
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard");
  redirect(`/dashboard/lessons/${lesson.id}`);
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
    return { id: lesson.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to move lesson." };
  }
}

/** Creates a lesson from a calendar click, without leaving the calendar page. */
export async function quickCreateLessonAction(input: {
  studentId: string;
  startTime: string;
  endTime: string;
}): Promise<CalendarActionResult> {
  const parsed = lessonInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid lesson details." };
  }

  const { supabase, tutorId } = await requireTutorId();

  try {
    const lesson = await createLesson(supabase, tutorId, parsed.data);
    revalidateTag(tutorTag("lessons", tutorId));
    revalidatePath("/dashboard/lessons");
    revalidatePath("/dashboard");
    return { id: lesson.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to schedule lesson." };
  }
}

export async function setLessonStatusAction(formData: FormData) {
  const id = formData.get("id");
  const status = lessonStatusSchema.safeParse(formData.get("status"));
  if (typeof id !== "string" || id === "" || !status.success) {
    throw new Error("Missing or invalid lesson status update.");
  }

  const { supabase, tutorId } = await requireTutorId();
  await updateLessonStatus(supabase, id, status.data);

  revalidateTag(tutorTag("lessons", tutorId));
  revalidatePath("/dashboard/lessons");
  revalidatePath(`/dashboard/lessons/${id}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/lessons/${id}`);
}
