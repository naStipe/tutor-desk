import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureCurrentTutorProfile } from "../../../features/tutor-profile/data";
import { createClient } from "../../../lib/supabase/server";

const nextSchema = z.literal("/dashboard").default("/dashboard");

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

  const tokenHashParsed = tokenHashSchema.safeParse(params);
  const codeParsed = codeSchema.safeParse(params);

  let next: string;
  if (tokenHashParsed.success) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHashParsed.data.token_hash,
      type: tokenHashParsed.data.type as EmailOtpType,
    });
    if (error) return NextResponse.redirect(new URL("/sign-in?error=confirmation", request.url));
    next = tokenHashParsed.data.next;
  } else if (codeParsed.success) {
    const { error } = await supabase.auth.exchangeCodeForSession(codeParsed.data.code);
    if (error) return NextResponse.redirect(new URL("/sign-in?error=confirmation", request.url));
    next = codeParsed.data.next;
  } else {
    return NextResponse.redirect(new URL("/sign-in?error=confirmation", request.url));
  }

  try {
    await ensureCurrentTutorProfile(supabase);
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=profile", request.url));
  }
  return NextResponse.redirect(new URL(next, request.url));
}
