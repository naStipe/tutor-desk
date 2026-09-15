import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLinkedStudentId } from "../../../features/students/data";
import { ensureCurrentTutorProfile } from "../../../features/tutor-profile/data";
import { getEnv } from "../../../lib/env";
import { createClient } from "../../../lib/supabase/server";

const INVITE_COMPLETE_PATTERN = /^\/invite\/([A-Za-z0-9_-]+)\/complete$/;

const nextSchema = z
  .union([z.literal("/dashboard"), z.string().regex(INVITE_COMPLETE_PATTERN)])
  .default("/dashboard");

const tokenHashSchema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(["signup", "invite", "magiclink", "recovery", "email", "email_change"]),
  next: nextSchema,
});

const codeSchema = z.object({
  code: z.string().min(1),
  next: nextSchema,
});

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const supabase = await createClient();
  const siteUrl = getEnv().NEXT_PUBLIC_SITE_URL;

  const tokenHashParsed = tokenHashSchema.safeParse(params);
  const codeParsed = codeSchema.safeParse(params);

  let next: string;
  let userId: string | undefined;
  if (tokenHashParsed.success) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHashParsed.data.token_hash,
      type: tokenHashParsed.data.type as EmailOtpType,
    });
    if (error) return NextResponse.redirect(new URL("/sign-in?error=confirmation", siteUrl));
    next = tokenHashParsed.data.next;
    userId = data.session?.user.id ?? data.user?.id;
  } else if (codeParsed.success) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(codeParsed.data.code);
    if (error) return NextResponse.redirect(new URL("/sign-in?error=confirmation", siteUrl));
    next = codeParsed.data.next;
    userId = data.session?.user.id ?? data.user?.id;
  } else {
    return NextResponse.redirect(new URL("/sign-in?error=confirmation", siteUrl));
  }

  if (!userId) return NextResponse.redirect(new URL("/sign-in?error=profile", siteUrl));

  const inviteMatch = next.match(INVITE_COMPLETE_PATTERN);
  if (inviteMatch) {
    const token = inviteMatch[1];
    const { error: rpcError } = await supabase.rpc("accept_student_invite", { p_token: token });
    if (rpcError) return NextResponse.redirect(new URL(`/invite/${token}?error=invite`, siteUrl));
    return NextResponse.redirect(new URL("/portal", siteUrl));
  }

  const linkedStudentId = await getLinkedStudentId(supabase, userId).catch(() => null);
  if (linkedStudentId) return NextResponse.redirect(new URL("/portal", siteUrl));

  try {
    await ensureCurrentTutorProfile(supabase, userId);
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=profile", siteUrl));
  }
  return NextResponse.redirect(new URL(next, siteUrl));
}
