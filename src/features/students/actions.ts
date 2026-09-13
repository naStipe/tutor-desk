"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { archiveStudent, createStudent, updateStudent } from "./data";
import { studentInputSchema } from "./schemas";

export type StudentActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function fields(formData: FormData) {
  return {
    name: formData.get("name"),
    email: formData.get("email"),
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

export async function createStudentAction(
  _state: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const parsed = studentInputSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase, tutorId } = await requireTutorId();

  let student: Awaited<ReturnType<typeof createStudent>>;
  try {
    student = await createStudent(supabase, tutorId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create student." };
  }

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard");
  redirect(`/dashboard/students/${student.id}`);
}

export async function updateStudentAction(
  _state: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return { error: "Missing student reference." };

  const parsed = studentInputSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { supabase } = await requireTutorId();

  try {
    await updateStudent(supabase, id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update student." };
  }

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${id}`);
  redirect(`/dashboard/students/${id}`);
}

export async function archiveStudentAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") throw new Error("Missing student reference.");

  const { supabase } = await requireTutorId();
  await archiveStudent(supabase, id);

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard");
  redirect("/dashboard/students");
}
