"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { tutorTag } from "../../lib/query-cache";
import { createClient } from "../../lib/supabase/server";
import { createSubject, deleteSubject } from "./data";
import { subjectInputSchema } from "./schemas";

export type SubjectActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function requireTutorId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/sign-in");
  return { supabase, tutorId: user.id };
}

export async function createSubjectAction(
  _state: SubjectActionState,
  formData: FormData,
): Promise<SubjectActionState> {
  const parsed = subjectInputSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase, tutorId } = await requireTutorId();

  try {
    await createSubject(supabase, tutorId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create subject." };
  }

  revalidateTag(tutorTag("subjects", tutorId));
  revalidatePath("/dashboard/subjects");
  return {};
}

export async function deleteSubjectAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") throw new Error("Missing subject reference.");

  const { supabase, tutorId } = await requireTutorId();
  await deleteSubject(supabase, id);

  revalidateTag(tutorTag("subjects", tutorId));
  revalidatePath("/dashboard/subjects");
  redirect("/dashboard/subjects");
}
