import { z } from "zod";

export const HOMEWORK_STATUSES = ["assigned", "submitted", "reviewed"] as const;
export type HomeworkStatus = (typeof HOMEWORK_STATUSES)[number];

const optionalTrimmed = (max: number, message: string) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.string().trim().max(max, message).optional());

const optionalUuid = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().uuid("Choose a valid lesson").optional());

const optionalDate = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date")
    .optional(),
);

export const homeworkInputSchema = z.object({
  studentId: z.string().uuid("Choose a student"),
  lessonId: optionalUuid,
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: optionalTrimmed(4000, "Description is too long"),
  dueDate: optionalDate,
});

export type HomeworkInput = z.infer<typeof homeworkInputSchema>;

export const submissionInputSchema = z.object({
  submissionText: z.string().trim().min(1, "Enter what the student submitted").max(4000),
});

export const feedbackInputSchema = z.object({
  feedbackText: z.string().trim().min(1, "Enter feedback").max(4000),
});
