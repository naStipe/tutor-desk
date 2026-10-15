import Link from "next/link";
import { redirect } from "next/navigation";
import { signInWithGoogleAction, signUpAction } from "../../../features/auth/actions";
import { AuthForm } from "../../../features/auth/components/AuthForm";
import { AuthBackdrop } from "../../../features/marketing/components/AuthBackdrop";
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
        footnote={
          <>
            By creating an account you agree to the{" "}
            <Link href="/terms" className="font-medium text-ink underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-ink underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </>
        }
      />
    </AuthBackdrop>
  );
}
