import { redirect } from "next/navigation";
import { AuthForm } from "../../features/auth/components/AuthForm";
import { signUpAction } from "../../features/auth/actions";
import { createClient } from "../../lib/supabase/server";

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <AuthForm
        action={signUpAction}
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
