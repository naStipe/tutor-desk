"use server";

import { redirect } from "next/navigation";
import { getEnv } from "../../lib/env";
import { createClient } from "../../lib/supabase/server";
import { ensureCurrentTutorProfile } from "../tutor-profile/data";
import { signInSchema, signUpSchema } from "./schemas";

export type AuthActionState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function fields(formData: FormData) {
  return { email: formData.get("email"), password: formData.get("password") };
}

export async function signUpAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const env = getEnv();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard` },
  });

  if (error) return { error: error.message };
  if (!data.session) {
    return { message: "Check your email to confirm your account, then sign in." };
  }

  try {
    await ensureCurrentTutorProfile(supabase, data.session.user.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to initialize tutor profile.",
    };
  }
  redirect("/dashboard");
}

export async function signInAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(fields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  try {
    await ensureCurrentTutorProfile(supabase, data.user.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to initialize tutor profile.",
    };
  }
  redirect("/dashboard");
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const env = getEnv();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) redirect("/sign-in?error=confirmation");
  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Unable to sign out: ${error.message}`);
  redirect("/sign-in");
}
