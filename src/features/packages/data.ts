import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import { computePackageBalance } from "./balance";
import type { PackageInput, TemplateInput } from "./schemas";

export type LessonPackage = Database["public"]["Tables"]["lesson_package"]["Row"];

export type PackageWithBalance = LessonPackage & {
  booked: number;
  used: number;
  remaining: number;
};

const PACKAGE_COLUMNS =
  "id, tutor_id, student_id, total_lessons, price, currency, note, purchased_at, created_at, updated_at";

export async function listPackagesForStudent(
  supabase: SupabaseClient<Database>,
  studentId: string,
): Promise<{ packages: PackageWithBalance[]; totals: ReturnType<typeof computePackageBalance> }> {
  const [{ data: packages, error }, { data: lessons, error: lessonsError }] = await Promise.all([
    supabase
      .from("lesson_package")
      .select(PACKAGE_COLUMNS)
      .eq("student_id", studentId)
      .order("purchased_at", { ascending: false }),
    supabase
      .from("lesson")
      .select("package_id, status")
      .eq("student_id", studentId)
      .not("package_id", "is", null),
  ]);
  if (error) throw new Error(`Unable to load packages: ${error.message}`);
  if (lessonsError) throw new Error(`Unable to load package usage: ${lessonsError.message}`);

  const statusesByPackage = new Map<string, string[]>();
  for (const lesson of lessons ?? []) {
    if (!lesson.package_id) continue;
    const list = statusesByPackage.get(lesson.package_id) ?? [];
    list.push(lesson.status);
    statusesByPackage.set(lesson.package_id, list);
  }

  const rows = (packages ?? []).map((pkg) => {
    const balance = computePackageBalance([pkg.total_lessons], statusesByPackage.get(pkg.id) ?? []);
    return { ...pkg, booked: balance.booked, used: balance.used, remaining: balance.remaining };
  });
  const totals = computePackageBalance(
    rows.map((row) => row.total_lessons),
    (lessons ?? []).map((lesson) => lesson.status),
  );
  return { packages: rows, totals };
}

export async function createPackage(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  input: PackageInput,
) {
  const { error } = await supabase.from("lesson_package").insert({
    tutor_id: tutorId,
    student_id: input.studentId,
    total_lessons: input.totalLessons,
    price: input.price ?? null,
    currency: input.price !== undefined ? (input.currency ?? null) : null,
    note: input.note ?? null,
  });
  if (error) throw new Error(`Unable to add package: ${error.message}`);
}

/**
 * Deleting a package gives its still-scheduled lessons back as unpaid; completed and no-show
 * lessons keep their paid status (the credit was already spent).
 */
export async function deletePackage(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  packageId: string,
) {
  const { error: releaseError } = await supabase
    .from("lesson")
    .update({
      package_id: null,
      payment_status: "unpaid",
      paid_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("tutor_id", tutorId)
    .eq("package_id", packageId)
    .eq("status", "scheduled");
  if (releaseError) throw new Error(`Unable to release package lessons: ${releaseError.message}`);

  const { error } = await supabase
    .from("lesson_package")
    .delete()
    .eq("id", packageId)
    .eq("tutor_id", tutorId);
  if (error) throw new Error(`Unable to delete package: ${error.message}`);
}

/** Covers a student's uncovered scheduled lessons from their packages and releases cancelled ones. */
export async function syncPackageCredits(supabase: SupabaseClient<Database>, studentId: string) {
  const { error } = await supabase.rpc("sync_student_package_credits", {
    p_student_id: studentId,
  });
  if (error) throw new Error(`Unable to apply package credits: ${error.message}`);
}

/** Never throws: a failed credit sync must not fail the lesson change that triggered it. */
export async function trySyncPackageCredits(supabase: SupabaseClient<Database>, studentId: string) {
  try {
    await syncPackageCredits(supabase, studentId);
  } catch {
    // The next lesson change or package change syncs again.
  }
}

/** Marks elapsed scheduled lessons completed. Never throws (e.g. before the migration is applied). */
export async function tryCompleteElapsedLessons(supabase: SupabaseClient<Database>) {
  try {
    await supabase.rpc("complete_elapsed_lessons");
  } catch {
    // Display status is derived from times anyway; the stored status catches up next time.
  }
}

export type PackageTemplate = Database["public"]["Tables"]["package_template"]["Row"];

const TEMPLATE_COLUMNS = "id, tutor_id, name, total_lessons, price, currency, created_at";

export async function listPackageTemplates(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("package_template")
    .select(TEMPLATE_COLUMNS)
    .order("total_lessons", { ascending: true });
  if (error) throw new Error(`Unable to load package presets: ${error.message}`);
  return data;
}

export async function createPackageTemplate(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  input: TemplateInput,
) {
  const { error } = await supabase.from("package_template").insert({
    tutor_id: tutorId,
    name: input.name,
    total_lessons: input.totalLessons,
    price: input.price ?? null,
    currency: input.price !== undefined ? (input.currency ?? null) : null,
  });
  if (error) throw new Error(`Unable to add package preset: ${error.message}`);
}

export async function deletePackageTemplate(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  templateId: string,
) {
  const { error } = await supabase
    .from("package_template")
    .delete()
    .eq("id", templateId)
    .eq("tutor_id", tutorId);
  if (error) throw new Error(`Unable to delete package preset: ${error.message}`);
}

export async function getPackageTemplate(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  templateId: string,
) {
  const { data, error } = await supabase
    .from("package_template")
    .select(TEMPLATE_COLUMNS)
    .eq("id", templateId)
    .eq("tutor_id", tutorId)
    .maybeSingle();
  if (error) throw new Error(`Unable to load package preset: ${error.message}`);
  return data;
}

/** Lessons left per student (bought minus covered, non-cancelled lessons); only students with credit. */
export async function getPackageCreditsByStudent(
  supabase: SupabaseClient<Database>,
): Promise<Record<string, number>> {
  const [{ data: packages, error }, { data: lessons, error: lessonsError }] = await Promise.all([
    supabase.from("lesson_package").select("student_id, total_lessons"),
    supabase.from("lesson").select("student_id, status").not("package_id", "is", null),
  ]);
  if (error) throw new Error(`Unable to load packages: ${error.message}`);
  if (lessonsError) throw new Error(`Unable to load package usage: ${lessonsError.message}`);

  const totals = new Map<string, number>();
  for (const pkg of packages ?? []) {
    totals.set(pkg.student_id, (totals.get(pkg.student_id) ?? 0) + pkg.total_lessons);
  }
  const statuses = new Map<string, string[]>();
  for (const lesson of lessons ?? []) {
    const list = statuses.get(lesson.student_id) ?? [];
    list.push(lesson.status);
    statuses.set(lesson.student_id, list);
  }
  const result: Record<string, number> = {};
  for (const [studentId, total] of totals) {
    const { remaining } = computePackageBalance([total], statuses.get(studentId) ?? []);
    if (remaining > 0) result[studentId] = remaining;
  }
  return result;
}

/** Never throws: the lesson form just omits the package hint if this fails. */
export async function tryGetPackageCreditsByStudent(supabase: SupabaseClient<Database>) {
  try {
    return await getPackageCreditsByStudent(supabase);
  } catch {
    return {};
  }
}
