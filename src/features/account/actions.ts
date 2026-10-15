"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "../../lib/supabase/admin";
import { createClient } from "../../lib/supabase/server";
import { deleteTutorAccount } from "./delete";
import { deleteAccountSchema, emailsMatch } from "./schemas";

export type DeleteAccountState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Permanently deletes the signed-in tutor's account and data. The target is always the session
 * user (verified with `getUser()`, which asks the auth server); no id is read from the form. The
 * typed email must match the account email.
 */
export async function deleteAccountAction(
  _state: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const parsed = deleteAccountSchema.safeParse({ confirmEmail: formData.get("confirmEmail") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) redirect("/sign-in");

  if (!emailsMatch(parsed.data.confirmEmail, user.email)) {
    return { fieldErrors: { confirmEmail: ["That email does not match your account"] } };
  }

  try {
    await deleteTutorAccount(createAdminClient(), user.id);
  } catch {
    return { error: "Couldn't delete your account. Nothing was changed. Try again or email us." };
  }

  // The auth user is gone; clear the session cookies. The server may reject the revoke call.
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Ignore: the account no longer exists.
  }
  redirect("/?notice=account-deleted");
}
