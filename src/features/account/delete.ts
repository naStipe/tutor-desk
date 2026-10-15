import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";

export const HOMEWORK_ATTACHMENTS_BUCKET = "homework-attachments";
const REMOVE_CHUNK_SIZE = 100;

type AdminClient = SupabaseClient<Database>;

/**
 * Deletes a tutor's account. Runs with the service-role client, so `userId` must come from the
 * validated session of the signed-in user and never from client input.
 *
 * Order: (1) remove the user's homework attachment files, because Storage objects are not covered
 * by foreign keys; (2) delete the auth user. Every tutor-owned table references
 * `tutor_profile(user_id)` and `tutor_profile` references `auth.users(id)`, both `on delete
 * cascade`, so step 2 removes students, lessons, series, homework (with comments and attachment
 * rows), subjects, rates, packages, package templates, notification logs, and the portal
 * memberships and invites of their students. If step 1 fails nothing is deleted.
 */
export async function deleteTutorAccount(admin: AdminClient, userId: string) {
  const { data: attachments, error: listError } = await admin
    .from("homework_attachment")
    .select("storage_path")
    .eq("tutor_id", userId);
  if (listError) throw new Error("Couldn't list attachments.");

  const paths = (attachments ?? []).map((row) => row.storage_path).filter(Boolean);
  for (let index = 0; index < paths.length; index += REMOVE_CHUNK_SIZE) {
    const { error } = await admin.storage
      .from(HOMEWORK_ATTACHMENTS_BUCKET)
      .remove(paths.slice(index, index + REMOVE_CHUNK_SIZE));
    if (error) throw new Error("Couldn't remove attachment files.");
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) throw new Error("Couldn't delete the account.");
}
