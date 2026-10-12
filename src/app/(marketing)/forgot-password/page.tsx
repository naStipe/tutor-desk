import { redirect } from "next/navigation";
import { AuthBackdrop } from "../../../features/marketing/components/AuthBackdrop";
import { RequestResetForm } from "../../../features/auth/components/RequestResetForm";
import { createClient } from "../../../lib/supabase/server";

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/dashboard");

  return (
    <AuthBackdrop>
      <RequestResetForm />
    </AuthBackdrop>
  );
}
