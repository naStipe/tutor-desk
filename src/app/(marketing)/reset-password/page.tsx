import { redirect } from "next/navigation";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { UpdatePasswordForm } from "../../../features/auth/components/UpdatePasswordForm";
import { createClient } from "../../../lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/forgot-password");

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <UpdatePasswordForm />
    </main>
  );
}
