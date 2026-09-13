"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { tutorTag } from "../../lib/query-cache";
import { createClient } from "../../lib/supabase/server";
import { deleteRate, upsertRate } from "./data";
import { rateInputSchema } from "./schemas";

export type RateActionState = {
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

export async function upsertRateAction(
  _state: RateActionState,
  formData: FormData,
): Promise<RateActionState> {
  const parsed = rateInputSchema.safeParse({
    studentId: formData.get("studentId"),
    subjectId: formData.get("subjectId"),
    hourlyRate: formData.get("hourlyRate"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase, tutorId } = await requireTutorId();

  try {
    await upsertRate(supabase, tutorId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to save rate." };
  }

  revalidateTag(tutorTag("rates", tutorId));
  revalidatePath(`/dashboard/students/${parsed.data.studentId}`);
  return {};
}

export async function deleteRateAction(formData: FormData) {
  const id = formData.get("id");
  const studentId = formData.get("studentId");
  if (typeof id !== "string" || id === "" || typeof studentId !== "string" || studentId === "") {
    throw new Error("Missing rate reference.");
  }

  const { supabase, tutorId } = await requireTutorId();
  await deleteRate(supabase, id);

  revalidateTag(tutorTag("rates", tutorId));
  revalidatePath(`/dashboard/students/${studentId}`);
  redirect(`/dashboard/students/${studentId}`);
}
