import { z } from "zod";

export const CURRENCIES = ["RUB", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const rateInputSchema = z.object({
  studentId: z.string().uuid("Choose a student"),
  subjectId: z.string().uuid("Choose a subject"),
  hourlyRate: z.coerce.number({ message: "Enter an hourly rate" }).positive("Enter an hourly rate"),
  currency: z.enum(CURRENCIES),
});

export type RateInput = z.infer<typeof rateInputSchema>;
