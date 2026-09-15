import { z } from "zod";
import { CURRENCIES } from "../rates/schemas";

const emptyToUndefined = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export const tutorProfileSettingsSchema = z.object({
  name: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  timezone: z.string().min(1, "Choose a timezone"),
  locale: z.string().min(1, "Choose a language"),
  currency: z.enum(CURRENCIES),
  defaultHourlyRate: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  }, z.coerce.number().min(0, "Rate can't be negative").optional()),
  paymentInstructions: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
});

export type TutorProfileSettingsInput = z.infer<typeof tutorProfileSettingsSchema>;
