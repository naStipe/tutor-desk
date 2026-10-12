import { redirect } from "next/navigation";
import { AuthBackdrop } from "../../../features/marketing/components/AuthBackdrop";
import { UpdatePasswordForm } from "../../../features/auth/components/UpdatePasswordForm";
import { createClient } from "../../../lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/forgot-password");

  return (
    <AuthBackdrop>
      <UpdatePasswordForm />
    </AuthBackdrop>
  );
}
