import { z } from "zod";

export const LESSON_STATUSES = ["scheduled", "completed", "cancelled", "no_show"] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["online", "invoice", "sbp"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CURRENCIES = ["RUB", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

const optionalTrimmedNotes = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().trim().max(4000, "Notes are too long").optional());

// FormData.get() returns null (not undefined) for a field that isn't present at all — e.g. an
// unchecked checkbox's sibling input that isn't rendered, or a <select> option with value="".
// z.optional() only treats `undefined` as "absent", so null must be normalized here too.
const emptyToUndefined = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const uuid = z.string().uuid("Choose a student");

const isoDateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Enter a valid date and time",
});

const optionalUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());
const optionalCurrency = z.preprocess(emptyToUndefined, z.enum(CURRENCIES).optional());
const optionalPaymentMethod = z.preprocess(emptyToUndefined, z.enum(PAYMENT_METHODS).optional());
const optionalPrice = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.coerce.number().int("Price must be a whole number").min(0, "Price can't be negative").optional());

export const lessonInputSchema = z.object({
  studentId: uuid,
  subjectId: optionalUuid,
  startTime: isoDateTime,
  durationMinutes: z.coerce
    .number({ message: "Enter a duration" })
    .int()
    .min(5, "Duration must be at least 5 minutes")
    .max(600, "Duration is too long")
    .default(60),
  notes: optionalTrimmedNotes,
  price: optionalPrice,
  currency: optionalCurrency,
  paymentStatus: z.enum(PAYMENT_STATUSES).default("unpaid"),
  paymentMethod: optionalPaymentMethod,
});

export type LessonInput = z.infer<typeof lessonInputSchema>;

export const recurrenceInputSchema = z.object({
  repeat: z.preprocess(
    (value) => value === "on" || value === true || value === "true",
    z.boolean(),
  ),
  repeatUntil: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Enter a valid end date" })
      .optional(),
  ),
});

export type RecurrenceInput = z.infer<typeof recurrenceInputSchema>;

export const lessonStatusSchema = z.enum(LESSON_STATUSES);
