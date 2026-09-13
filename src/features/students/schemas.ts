import { z } from "zod";

const optionalTrimmed = (schema: z.ZodString) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, schema.optional());

export const studentInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  email: optionalTrimmed(
    z.string().trim().email("Enter a valid email address").max(320).toLowerCase(),
  ),
  phone: optionalTrimmed(z.string().trim().max(40, "Phone number is too long")),
  telegram: optionalTrimmed(z.string().trim().max(100, "Telegram username is too long")),
  notes: optionalTrimmed(z.string().trim().max(4000, "Notes are too long")),
});

export type StudentInput = z.infer<typeof studentInputSchema>;
