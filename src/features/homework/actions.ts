"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { tutorTag } from "../../lib/query-cache";
import {
  createAttachment,
  createHomework,
  deleteAttachment,
  HOMEWORK_ATTACHMENTS_BUCKET,
  recordFeedback,
  recordSubmission,
  updateHomework,
} from "./data";
import { feedbackInputSchema, homeworkInputSchema, submissionInputSchema } from "./schemas";

export type HomeworkActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type AttachmentActionState = { error?: string };

function fields(formData: FormData) {
  return {
    // A <select>'s currently-selected option being absent from submission (e.g. a disabled
    // placeholder) makes FormData.get return null rather than "" — normalize so validation
    // reports our friendly message instead of Zod's generic "expected string" one.
    studentId: formData.get("studentId") ?? "",
    lessonId: formData.get("lessonId"),
    subjectId: formData.get("subjectId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
    links: formData.get("links") ?? "",
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

  revalidateTag(tutorTag("homework", tutorId));
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

  const { supabase, tutorId } = await requireTutorId();

  try {
    await updateHomework(supabase, id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update homework." };
  }

  revalidateTag(tutorTag("homework", tutorId));
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

  const { supabase, tutorId } = await requireTutorId();

  try {
    await recordSubmission(supabase, id, parsed.data.submissionText);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to record submission." };
  }

  revalidateTag(tutorTag("homework", tutorId));
  revalidatePath("/dashboard/homework");
  revalidatePath(`/dashboard/homework/${id}`);
  redirect(`/dashboard/homework/${id}`);
}

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export async function uploadHomeworkAttachmentAction(
  _state: AttachmentActionState,
  formData: FormData,
): Promise<AttachmentActionState> {
  const homeworkId = formData.get("homeworkId");
  const file = formData.get("file");
  if (typeof homeworkId !== "string" || homeworkId === "") {
    return { error: "Missing homework reference." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { error: "Files must be 15MB or smaller." };
  }

  const { supabase, tutorId } = await requireTutorId();
  const storagePath = `${tutorId}/${homeworkId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(HOMEWORK_ATTACHMENTS_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) return { error: `Unable to upload file: ${uploadError.message}` };

  try {
    await createAttachment(supabase, {
      tutorId,
      homeworkId,
      storagePath,
      fileName: file.name,
      contentType: file.type || null,
      sizeBytes: file.size,
    });
  } catch (error) {
    await supabase.storage.from(HOMEWORK_ATTACHMENTS_BUCKET).remove([storagePath]);
    return { error: error instanceof Error ? error.message : "Unable to save attachment." };
  }

  revalidatePath(`/dashboard/homework/${homeworkId}`);
  return {};
}

export async function deleteHomeworkAttachmentAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const homeworkId = formData.get("homeworkId");
  if (typeof id !== "string" || id === "") return;

  const { supabase } = await requireTutorId();
  const deleted = await deleteAttachment(supabase, id);
  if (deleted?.storage_path) {
    await supabase.storage.from(HOMEWORK_ATTACHMENTS_BUCKET).remove([deleted.storage_path]);
  }

  if (typeof homeworkId === "string" && homeworkId !== "") {
    revalidatePath(`/dashboard/homework/${homeworkId}`);
  }
}

export async function recordFeedbackAction(
  _state: HomeworkActionState,
  formData: FormData,
): Promise<HomeworkActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return { error: "Missing homework reference." };

  const parsed = feedbackInputSchema.safeParse({ feedbackText: formData.get("feedbackText") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase, tutorId } = await requireTutorId();

  try {
    await recordFeedback(supabase, id, parsed.data.feedbackText);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to record feedback." };
  }

  revalidateTag(tutorTag("homework", tutorId));
  revalidatePath("/dashboard/homework");
  revalidatePath(`/dashboard/homework/${id}`);
  redirect(`/dashboard/homework/${id}`);
}
