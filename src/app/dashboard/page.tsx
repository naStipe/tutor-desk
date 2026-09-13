import { redirect } from "next/navigation";
import { signOutAction } from "../../features/auth/actions";
import { ensureCurrentTutorProfile } from "../../features/tutor-profile/data";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  await ensureCurrentTutorProfile(supabase);

  return (
    <main className="min-h-screen p-6 sm:p-12">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-blue-600">Tutor workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Welcome to TutorDesk</h1>
            <p className="mt-2 text-sm text-slate-600">Signed in as {data.user.email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
        <p className="mt-8 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          Your tutor profile is initialized and protected by row-level security.
        </p>
      </div>
    </main>
  );
}
