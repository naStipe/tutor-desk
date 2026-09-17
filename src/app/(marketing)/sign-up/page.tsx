import { redirect } from "next/navigation";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { AuthForm } from "../../../features/auth/components/AuthForm";
import { signUpAction, signInWithGoogleAction } from "../../../features/auth/actions";
import { hasPortalMembership } from "../../../features/students/data";
import { createClient } from "../../../lib/supabase/server";

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const hasPortalAccess = await hasPortalMembership(supabase).catch(() => false);
    redirect(hasPortalAccess ? "/portal" : "/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <AuthForm
        action={signUpAction}
        googleAction={signInWithGoogleAction}
        heading="Create tutor account"
        description="Start your TutorDesk workspace with email and password."
        submitLabel="Create account"
        pendingLabel="Creating account…"
        alternateText="Already registered?"
        alternateHref="/sign-in"
        alternateLabel="Sign in"
      />
    </main>
  );
}
