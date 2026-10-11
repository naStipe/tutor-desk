import { z } from "zod";
import { CURRENCIES } from "../rates/schemas";

const emptyToUndefined = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export const MAX_PACKAGE_LESSONS = 1000;

export const packageInputSchema = z.object({
  studentId: z.string().uuid("Missing student reference"),
  totalLessons: z.coerce
    .number({ message: "Enter the number of lessons" })
    .int("Enter a whole number of lessons")
    .min(1, "A package has at least 1 lesson")
    .max(MAX_PACKAGE_LESSONS, "Too many lessons"),
  price: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .min(0, "Price can't be negative")
      .multipleOf(0.01, "Price can have at most 2 decimal places")
      .optional(),
  ),
  currency: z.preprocess(emptyToUndefined, z.enum(CURRENCIES).optional()),
  note: z.preprocess(emptyToUndefined, z.string().trim().max(500, "Note is too long").optional()),
});

export type PackageInput = z.infer<typeof packageInputSchema>;

export const templateInputSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(100, "Name is too long"),
  totalLessons: packageInputSchema.shape.totalLessons,
  price: packageInputSchema.shape.price,
  currency: packageInputSchema.shape.currency,
});

export type TemplateInput = z.infer<typeof templateInputSchema>;

export const applyTemplateSchema = z.object({
  studentId: z.string().uuid("Missing student reference"),
  templateId: z.string().uuid("Choose a package"),
});
