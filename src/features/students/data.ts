import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import type { StudentInput } from "./schemas";

export type Student = Database["public"]["Tables"]["student"]["Row"];

const STUDENT_COLUMNS =
  "id, tutor_id, name, email, phone, telegram, notes, default_hourly_rate, default_currency, archived_at, created_at, updated_at";

export async function listActiveStudents(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("student")
    .select(STUDENT_COLUMNS)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(`Unable to load students: ${error.message}`);
  return data;
}

export async function listArchivedStudents(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("student")
    .select(STUDENT_COLUMNS)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  if (error) throw new Error(`Unable to load archived students: ${error.message}`);
  return data;
}

export async function getStudent(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("student")
    .select(STUDENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load student: ${error.message}`);
  return data;
}

export async function createStudent(
  supabase: SupabaseClient<Database>,
  tutorId: string,
  input: StudentInput,
) {
  const { data, error } = await supabase
    .from("student")
    .insert({
      tutor_id: tutorId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      telegram: input.telegram ?? null,
      notes: input.notes ?? null,
      default_hourly_rate: input.defaultHourlyRate ?? null,
      default_currency: input.defaultHourlyRate ? input.defaultCurrency : null,
    })
    .select(STUDENT_COLUMNS)
    .single();

  if (error) throw new Error(`Unable to create student: ${error.message}`);
  return data;
}

export async function updateStudent(
  supabase: SupabaseClient<Database>,
  id: string,
  input: StudentInput,
) {
  const { data, error } = await supabase
    .from("student")
    .update({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      telegram: input.telegram ?? null,
      notes: input.notes ?? null,
      default_hourly_rate: input.defaultHourlyRate ?? null,
      default_currency: input.defaultHourlyRate ? input.defaultCurrency : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(STUDENT_COLUMNS)
    .single();

  if (error) throw new Error(`Unable to update student: ${error.message}`);
  return data;
}

export async function archiveStudent(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase
    .from("student")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(`Unable to archive student: ${error.message}`);
}

export async function deleteStudent(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase.from("student").delete().eq("id", id);

  if (error) throw new Error(`Unable to delete student: ${error.message}`);
}

/** Whether this signed-in user already has a portal account linked to any student. */
export async function hasPortalMembership(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("portal_list_students");
  if (error) throw new Error(`Unable to check linked student: ${error.message}`);
  return (data ?? []).length > 0;
}

export type PortalRole = "learner" | "guardian" | "payer";

/** Portal memberships (and any outstanding invite) for one student, for the tutor's own view. */
export async function listPortalMembers(supabase: SupabaseClient<Database>, studentId: string) {
  const [{ data: members, error: membersError }, { data: invites, error: invitesError }] =
    await Promise.all([
      supabase
        .from("portal_membership")
        .select("id, role, created_at")
        .eq("student_id", studentId),
      supabase
        .from("portal_invite")
        .select("id, role, email, expires_at")
        .eq("student_id", studentId)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString()),
    ]);

  if (membersError) throw new Error(`Unable to load portal access: ${membersError.message}`);
  if (invitesError) throw new Error(`Unable to load pending invites: ${invitesError.message}`);
  return { members: members ?? [], pendingInvites: invites ?? [] };
}

export async function createPortalInvite(
  supabase: SupabaseClient<Database>,
  studentId: string,
  role: PortalRole,
  tokenHash: string,
  expiresAt: string,
) {
  const { error } = await supabase.from("portal_invite").insert({
    student_id: studentId,
    role,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) throw new Error(`Unable to create invite: ${error.message}`);
}
