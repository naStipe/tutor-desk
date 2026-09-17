import { redirect } from "next/navigation";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { AuthForm } from "../../../features/auth/components/AuthForm";
import { signInAction, signInWithGoogleAction } from "../../../features/auth/actions";
import { hasPortalMembership } from "../../../features/students/data";
import { createClient } from "../../../lib/supabase/server";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const hasPortalAccess = await hasPortalMembership(supabase).catch(() => false);
    redirect(hasPortalAccess ? "/portal" : "/dashboard");
  }

  const { error, notice: noticeParam } = await searchParams;
  const notice =
    error === "profile"
      ? "Your email was confirmed, but TutorDesk could not initialize your profile. Please sign in to retry."
      : error === "confirmation"
        ? "That confirmation link is invalid or expired. Request a new email or sign in if you already confirmed."
        : noticeParam === "password-updated"
          ? "Your password has been updated. Sign in with your new password."
          : undefined;

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <AuthForm
        action={signInAction}
        googleAction={signInWithGoogleAction}
        heading="Tutor sign in"
        description="Access your TutorDesk workspace."
        submitLabel="Sign in"
        pendingLabel="Signing in…"
        alternateText="Need an account?"
        alternateHref="/sign-up"
        alternateLabel="Create one"
        notice={notice}
        forgotPasswordHref="/forgot-password"
      />
    </main>
  );
}
