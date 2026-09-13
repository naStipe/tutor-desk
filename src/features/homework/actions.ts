"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { createHomework, recordFeedback, recordSubmission, updateHomework } from "./data";
import { feedbackInputSchema, homeworkInputSchema, submissionInputSchema } from "./schemas";

export type HomeworkActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function fields(formData: FormData) {
  return {
    // A <select>'s currently-selected option being absent from submission (e.g. a disabled
    // placeholder) makes FormData.get return null rather than "" — normalize so validation
    // reports our friendly message instead of Zod's generic "expected string" one.
    studentId: formData.get("studentId") ?? "",
    lessonId: formData.get("lessonId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
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

export async function createHomeworkAction(
  _state: HomeworkActionState,
  formData: FormData,
): Promise<HomeworkActionState> {
  const parsed = homeworkInputSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase, tutorId } = await requireTutorId();

  let homework: Awaited<ReturnType<typeof createHomework>>;
  try {
    homework = await createHomework(supabase, tutorId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create homework." };
  }

  revalidatePath("/dashboard/homework");
  revalidatePath("/dashboard");
  redirect(`/dashboard/homework/${homework.id}`);
}

export async function updateHomeworkAction(
  _state: HomeworkActionState,
  formData: FormData,
): Promise<HomeworkActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return { error: "Missing homework reference." };

  const parsed = homeworkInputSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase } = await requireTutorId();

  try {
    await updateHomework(supabase, id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update homework." };
  }

  revalidatePath("/dashboard/homework");
  revalidatePath(`/dashboard/homework/${id}`);
  redirect(`/dashboard/homework/${id}`);
}

export async function recordSubmissionAction(
  _state: HomeworkActionState,
  formData: FormData,
): Promise<HomeworkActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return { error: "Missing homework reference." };

  const parsed = submissionInputSchema.safeParse({
    submissionText: formData.get("submissionText"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase } = await requireTutorId();

  try {
    await recordSubmission(supabase, id, parsed.data.submissionText);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to record submission." };
  }

  revalidatePath("/dashboard/homework");
  revalidatePath(`/dashboard/homework/${id}`);
  redirect(`/dashboard/homework/${id}`);
}

export async function recordFeedbackAction(
  _state: HomeworkActionState,
  formData: FormData,
): Promise<HomeworkActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return { error: "Missing homework reference." };

  const parsed = feedbackInputSchema.safeParse({ feedbackText: formData.get("feedbackText") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase } = await requireTutorId();

  try {
    await recordFeedback(supabase, id, parsed.data.feedbackText);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to record feedback." };
  }

  revalidatePath("/dashboard/homework");
  revalidatePath(`/dashboard/homework/${id}`);
  redirect(`/dashboard/homework/${id}`);
}
