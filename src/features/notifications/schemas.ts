import { z } from "zod";

/** Zod's email check rejects whitespace and control characters, which blocks header injection. */
export const recipientEmailSchema = z.string().trim().email().max(254);

export const sendBalanceReminderSchema = z.object({
  studentId: z.string().uuid(),
});

/** "student@example.com" -> "s***@example.com". Enough to audit, not enough to harvest. */
export function maskEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 1) return "***";
  return `${email[0]}***${email.slice(at)}`;
}

/** Picks the first usable address from an ordered candidate list, or null. */
export function pickRecipient(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = recipientEmailSchema.safeParse(candidate);
    if (parsed.success) return parsed.data;
  }
  return null;
}
