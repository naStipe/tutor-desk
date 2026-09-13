"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { createLesson, updateLesson, updateLessonStatus } from "./data";
import { lessonInputSchema, lessonStatusSchema } from "./schemas";

export type LessonActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function fields(formData: FormData) {
  return {
    studentId: formData.get("studentId"),
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

  const { supabase } = await requireTutorId();

  try {
    await updateLesson(supabase, id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update lesson." };
  }

  revalidatePath("/dashboard/lessons");
  revalidatePath(`/dashboard/lessons/${id}`);
  redirect(`/dashboard/lessons/${id}`);
}

export async function setLessonStatusAction(formData: FormData) {
  const id = formData.get("id");
  const status = lessonStatusSchema.safeParse(formData.get("status"));
  if (typeof id !== "string" || id === "" || !status.success) {
    throw new Error("Missing or invalid lesson status update.");
  }

  const { supabase } = await requireTutorId();
  await updateLessonStatus(supabase, id, status.data);

  revalidatePath("/dashboard/lessons");
  revalidatePath(`/dashboard/lessons/${id}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/lessons/${id}`);
}
