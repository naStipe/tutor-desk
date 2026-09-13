import { z } from "zod";

export const subjectInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
});

export type SubjectInput = z.infer<typeof subjectInputSchema>;
