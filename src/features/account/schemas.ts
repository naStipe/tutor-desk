import { z } from "zod";

export const deleteAccountSchema = z.object({
  confirmEmail: z
    .string()
    .trim()
    .min(1, "Type your account email to confirm")
    .max(320, "Type your account email to confirm"),
});

/** Case-insensitive, whitespace-tolerant comparison of the typed email with the account email. */
export function emailsMatch(typed: string, accountEmail: string | null | undefined) {
  if (!accountEmail) return false;
  return typed.trim().toLowerCase() === accountEmail.trim().toLowerCase();
}
