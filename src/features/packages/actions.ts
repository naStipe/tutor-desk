"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { tutorTag } from "../../lib/query-cache";
import { createClient } from "../../lib/supabase/server";
import { createPackage, deletePackage, syncPackageCredits } from "./data";
import { packageInputSchema } from "./schemas";

export type PackageActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: string;
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

function revalidateAfterPackageChange(tutorId: string, studentId: string) {
  revalidateTag(tutorTag("lessons", tutorId));
  revalidatePath(`/dashboard/students/${studentId}`, "layout");
  revalidatePath("/dashboard/lessons");
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard");
}

/**
 * Adds a prepaid package to a student and immediately covers their upcoming unpaid lessons.
 * Ownership: `requireTutorId`, the insert policy (student must belong to the tutor) and the
 * `tutor_id` written from the session, never from the client.
 */
export async function createPackageAction(
  _state: PackageActionState,
  formData: FormData,
): Promise<PackageActionState> {
  const parsed = packageInputSchema.safeParse({
    studentId: formData.get("studentId"),
    totalLessons: formData.get("totalLessons"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { error: flat.formErrors[0], fieldErrors: flat.fieldErrors };
  }

  const { supabase, tutorId } = await requireTutorId();
  try {
    await createPackage(supabase, tutorId, parsed.data);
    await syncPackageCredits(supabase, parsed.data.studentId);
  } catch {
    return { error: "Couldn't add the package. Try again." };
  }

  revalidateAfterPackageChange(tutorId, parsed.data.studentId);
  return { success: `Added a package of ${parsed.data.totalLessons} lessons.` };
}

export async function deletePackageAction(formData: FormData) {
  const packageId = formData.get("packageId");
  const studentId = formData.get("studentId");
  if (
    typeof packageId !== "string" ||
    typeof studentId !== "string" ||
    packageId === "" ||
    studentId === ""
  ) {
    throw new Error("Missing package reference.");
  }

  const { supabase, tutorId } = await requireTutorId();
  await deletePackage(supabase, tutorId, packageId);
  await syncPackageCredits(supabase, studentId);

  revalidateAfterPackageChange(tutorId, studentId);
  redirect(`/dashboard/students/${studentId}/billing`);
}
