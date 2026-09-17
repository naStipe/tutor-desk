"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthActionState } from "../auth/actions";
import { signInSchema, signUpSchema } from "../auth/schemas";
import { getEnv } from "../../lib/env";
import type { Database } from "../../lib/supabase/database.types";
import { createClient } from "../../lib/supabase/server";

function fields(formData: FormData) {
  return { email: formData.get("email"), password: formData.get("password") };
}

async function acceptInvite(supabase: SupabaseClient<Database>, token: string) {
  const { error } = await supabase.rpc("accept_portal_invite", { p_token: token });
  if (error) throw new Error(error.message);
}

export async function acceptInviteSignUpAction(
  token: string,
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const env = getEnv();
  const next = encodeURIComponent(`/invite/${token}/complete`);
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=${next}` },
  });

  if (error) return { error: error.message };
  if (!data.session) {
    return {
      message: "Check your email to confirm your account — you'll be linked automatically.",
    };
  }

  try {
    await acceptInvite(supabase, token);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to accept this invite." };
  }
  redirect("/portal");
}

export async function acceptInviteSignInAction(
  token: string,
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
  if (signInError) return { error: signInError.message };

  try {
    await acceptInvite(supabase, token);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to accept this invite." };
  }
  redirect("/portal");
}

export async function confirmAcceptInviteAction(formData: FormData) {
  const token = formData.get("token");
  if (typeof token !== "string" || token === "") throw new Error("Missing invite token.");

  const supabase = await createClient();
  await acceptInvite(supabase, token);
  redirect("/portal");
}
