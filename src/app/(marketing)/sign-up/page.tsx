import { redirect } from "next/navigation";
import { AuthBackdrop } from "../../../features/marketing/components/AuthBackdrop";
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
    <AuthBackdrop>
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
    </AuthBackdrop>
  );
}
