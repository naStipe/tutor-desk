"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { cancelScheduledLessonsForStudent } from "../lessons/data";
import { createClient } from "../../lib/supabase/server";
import { tutorTag } from "../../lib/query-cache";
import {
  archiveStudent,
  createPortalInvite,
  createStudent,
  deleteStudent,
  type PortalRole,
  updateStudent,
} from "./data";
import { studentInputSchema } from "./schemas";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type StudentActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function fields(formData: FormData) {
  return {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    telegram: formData.get("telegram"),
    notes: formData.get("notes"),
    defaultHourlyRate: formData.get("defaultHourlyRate"),
    defaultCurrency: formData.get("defaultCurrency") ?? "RUB",
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
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { error: flat.formErrors[0], fieldErrors: flat.fieldErrors };
  }

  const { supabase, tutorId } = await requireTutorId();

  let student: Awaited<ReturnType<typeof createStudent>>;
  try {
    student = await createStudent(supabase, tutorId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create student." };
  }

  revalidateTag(tutorTag("students", tutorId));
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard");
  redirect(`/dashboard/students?highlight=${student.id}`);
}

export async function updateStudentAction(
  _state: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return { error: "Missing student reference." };

  const parsed = studentInputSchema.safeParse(fields(formData));
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { error: flat.formErrors[0], fieldErrors: flat.fieldErrors };
  }

  const { supabase, tutorId } = await requireTutorId();

  try {
    await updateStudent(supabase, id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update student." };
  }

  revalidateTag(tutorTag("students", tutorId));
  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${id}`);
  redirect(`/dashboard/students/${id}`);
}

export async function generateStudentInviteAction(
  studentId: string,
  role: PortalRole = "learner",
): Promise<{ token: string } | { error: string }> {
  const { supabase } = await requireTutorId();

  const token = randomBytes(24).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  try {
    await createPortalInvite(supabase, studentId, role, tokenHash, expiresAt);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create invite." };
  }
  return { token };
}

export async function archiveStudentAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") throw new Error("Missing student reference.");

  const { supabase, tutorId } = await requireTutorId();
  await cancelScheduledLessonsForStudent(supabase, id);
  await archiveStudent(supabase, id);

  revalidateTag(tutorTag("students", tutorId));
  revalidateTag(tutorTag("lessons", tutorId));
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/students/archived");
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard");
  redirect("/dashboard/students");
}

export async function deleteStudentAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") throw new Error("Missing student reference.");
  const from = formData.get("from");
  const redirectTo = typeof from === "string" && from !== "" ? from : "/dashboard/students";

  const { supabase, tutorId } = await requireTutorId();
  await cancelScheduledLessonsForStudent(supabase, id);
  await deleteStudent(supabase, id);

  revalidateTag(tutorTag("students", tutorId));
  revalidateTag(tutorTag("lessons", tutorId));
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/students/archived");
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard");
  redirect(redirectTo);
}
