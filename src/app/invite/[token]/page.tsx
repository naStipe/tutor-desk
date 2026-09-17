import { redirect } from "next/navigation";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { AuthForm } from "../../../features/auth/components/AuthForm";
import {
  acceptInviteSignInAction,
  acceptInviteSignUpAction,
  confirmAcceptInviteAction,
} from "../../../features/invites/actions";
import { hasPortalMembership } from "../../../features/students/data";
import { createClient } from "../../../lib/supabase/server";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const { token } = await params;
  const { mode, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const hasPortalAccess = await hasPortalMembership(supabase).catch(() => false);
    if (hasPortalAccess) redirect("/portal");

    return (
      <main className="relative flex min-h-screen items-center justify-center p-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md space-y-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">Accept invite</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Signed in as {user.email}. Link this account to your student portal?
            </p>
          </div>
          <form action={confirmAcceptInviteAction}>
            <input type="hidden" name="token" value={token} />
            <Button type="submit" className="w-full">
              Accept invite
            </Button>
          </form>
        </Card>
      </main>
    );
  }

  const signIn = mode === "sign-in";

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      {signIn ? (
        <AuthForm
          action={acceptInviteSignInAction.bind(null, token)}
          heading="Sign in to accept your invite"
          description="Use your existing TutorDesk account to link this invite."
          submitLabel="Sign in & accept"
          pendingLabel="Signing in…"
          alternateText="Don't have an account?"
          alternateHref={`/invite/${token}`}
          alternateLabel="Create one"
        />
      ) : (
        <AuthForm
          action={acceptInviteSignUpAction.bind(null, token)}
          heading="You've been invited to TutorDesk"
          description="Create an account to see your schedule and homework."
          submitLabel="Create account"
          pendingLabel="Creating account…"
          alternateText="Already have an account?"
          alternateHref={`/invite/${token}?mode=sign-in`}
          alternateLabel="Sign in"
          notice={
            error === "invite"
              ? "This invite link is invalid or has expired. Ask your tutor for a new one."
              : undefined
          }
        />
      )}
    </main>
  );
}
