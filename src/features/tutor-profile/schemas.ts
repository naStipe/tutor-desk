import { z } from "zod";
import { CURRENCIES } from "../rates/schemas";

const emptyToUndefined = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const workingHoursTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time")
  .transform((value) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  });

export const tutorProfileSettingsSchema = z
  .object({
    name: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
    timezone: z.string().min(1, "Choose a timezone"),
    locale: z.string().min(1, "Choose a language"),
    currency: z.enum(CURRENCIES),
    defaultHourlyRate: z.preprocess((value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return value;
    }, z.coerce.number().min(0, "Rate can't be negative").optional()),
    paymentInstructions: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
    contactEmail: z.preprocess(
      emptyToUndefined,
      z.string().trim().email("Enter a valid email").max(255).optional(),
    ),
    contactPhone: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
    workingHoursStartMinutes: workingHoursTime,
    workingHoursEndMinutes: workingHoursTime,
  })
  .refine((data) => data.workingHoursStartMinutes < data.workingHoursEndMinutes, {
    message: "Working hours must end after they start",
    path: ["workingHoursEndMinutes"],
  });

export type TutorProfileSettingsInput = z.infer<typeof tutorProfileSettingsSchema>;
