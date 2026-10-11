"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { tutorTag } from "../../lib/query-cache";
import { createClient } from "../../lib/supabase/server";
import {
  createPackage,
  createPackageTemplate,
  deletePackage,
  deletePackageTemplate,
  getPackageTemplate,
  syncPackageCredits,
} from "./data";
import { applyTemplateSchema, packageInputSchema, templateInputSchema } from "./schemas";

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

/** Applies one of the tutor's presets to a student: copies its values into a new package. */
export async function applyPackageTemplateAction(
  _state: PackageActionState,
  formData: FormData,
): Promise<PackageActionState> {
  const parsed = applyTemplateSchema.safeParse({
    studentId: formData.get("studentId"),
    templateId: formData.get("templateId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Choose a package." };

  const { supabase, tutorId } = await requireTutorId();
  try {
    // Read through the tutor-scoped query so another tutor's preset id resolves to nothing.
    const template = await getPackageTemplate(supabase, tutorId, parsed.data.templateId);
    if (!template) return { error: "That package no longer exists." };
    await createPackage(supabase, tutorId, {
      studentId: parsed.data.studentId,
      totalLessons: template.total_lessons,
      price: template.price ?? undefined,
      currency: (template.currency ?? undefined) as "RUB" | "EUR" | undefined,
      note: template.name,
    });
    await syncPackageCredits(supabase, parsed.data.studentId);
  } catch {
    return { error: "Couldn't add the package. Try again." };
  }

  revalidateAfterPackageChange(tutorId, parsed.data.studentId);
  return { success: "Package added." };
}

export async function createPackageTemplateAction(
  _state: PackageActionState,
  formData: FormData,
): Promise<PackageActionState> {
  const parsed = templateInputSchema.safeParse({
    name: formData.get("name"),
    totalLessons: formData.get("totalLessons"),
    price: formData.get("price"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { error: flat.formErrors[0], fieldErrors: flat.fieldErrors };
  }

  const { supabase, tutorId } = await requireTutorId();
  try {
    await createPackageTemplate(supabase, tutorId, parsed.data);
  } catch {
    return { error: "Couldn't save the package. Try again." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/students", "layout");
  return { success: "Package saved." };
}

export async function deletePackageTemplateAction(formData: FormData) {
  const templateId = formData.get("templateId");
  if (typeof templateId !== "string" || templateId === "") {
    throw new Error("Missing package reference.");
  }
  const { supabase, tutorId } = await requireTutorId();
  await deletePackageTemplate(supabase, tutorId, templateId);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/students", "layout");
  redirect("/dashboard/settings");
}
