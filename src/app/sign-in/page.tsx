import { redirect } from "next/navigation";
import { AuthForm } from "../../features/auth/components/AuthForm";
import { signInAction } from "../../features/auth/actions";
import { createClient } from "../../lib/supabase/server";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/dashboard");

  const { error } = await searchParams;
  const notice =
    error === "profile"
      ? "Your email was confirmed, but TutorDesk could not initialize your profile. Please sign in to retry."
      : error === "confirmation"
        ? "That confirmation link is invalid or expired. Request a new email or sign in if you already confirmed."
        : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <AuthForm
        action={signInAction}
        heading="Tutor sign in"
        description="Access your TutorDesk workspace."
        submitLabel="Sign in"
        pendingLabel="Signing in…"
        alternateText="Need an account?"
        alternateHref="/sign-up"
        alternateLabel="Create one"
        notice={notice}
      />
    </main>
  );
}
