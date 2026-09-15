"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "../../lib/supabase/server";

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
