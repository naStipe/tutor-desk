"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "../../lib/supabase/server";
import { createHomeworkComment, getHomework } from "../homework/data";
import { listPortalStudents } from "./data";

export type PortalActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const submissionSchema = z.object({
  submissionText: z.string().trim().min(1, "Enter your answer").max(4000),
});

export async function submitHomeworkAction(
  _state: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return { error: "Missing homework reference." };

  const parsed = submissionSchema.safeParse({ submissionText: formData.get("submissionText") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase.rpc("submit_homework", {
    p_homework_id: id,
    p_submission_text: parsed.data.submissionText,
  });
  if (error) return { error: error.message };

  revalidatePath("/portal/homework");
  return {};
}

const commentSchema = z.object({
  body: z.string().trim().min(1, "Enter a message").max(4000),
});

export async function addPortalHomeworkCommentAction(
  _state: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const homeworkId = formData.get("homeworkId");
  if (typeof homeworkId !== "string" || homeworkId === "") {
    return { error: "Missing homework reference." };
  }

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const homework = await getHomework(supabase, homeworkId);
  if (!homework) return { error: "Homework not found." };

  const students = await listPortalStudents(supabase);
  const membership = students.find((student) => student.id === homework.student_id);
  if (!membership) return { error: "You don't have access to this homework." };

  try {
    await createHomeworkComment(supabase, {
      tutorId: homework.tutor_id,
      homeworkId,
      authorId: user.id,
      authorRole: membership.role,
      body: parsed.data.body,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to post comment." };
  }

  revalidatePath("/portal/homework");
  return {};
}
