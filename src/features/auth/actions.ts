"use server";

import { redirect } from "next/navigation";
import { getEnv } from "../../lib/env";
import { createClient } from "../../lib/supabase/server";
import { hasPortalMembership } from "../students/data";
import { ensureCurrentTutorProfile } from "../tutor-profile/data";
import {
  requestPasswordResetSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./schemas";

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

  const hasPortalAccess = await hasPortalMembership(supabase).catch(() => false);
  if (hasPortalAccess) redirect("/portal");

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

  const hasPortalAccess = await hasPortalMembership(supabase).catch(() => false);
  if (hasPortalAccess) redirect("/portal");

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

export async function requestPasswordResetAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const env = getEnv();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reset-password`,
  });
  // Supabase doesn't report whether the email exists, so this message is shown either way.
  if (error) return { error: error.message };
  return { message: "If an account exists for that email, we've sent a password reset link." };
}

export async function updatePasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  redirect("/sign-in?notice=password-updated");
}
