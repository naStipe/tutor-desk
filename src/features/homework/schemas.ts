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

const linkListSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value === undefined || value === null ? [] : value;
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf("|");
      if (separatorIndex === -1) return { label: null, url: line.trim() };
      return {
        label: line.slice(0, separatorIndex).trim() || null,
        url: line.slice(separatorIndex + 1).trim(),
      };
    });
}, z.array(z.object({ label: z.string().nullable(), url: z.string().url("Enter a valid URL") })).max(20, "Too many links"));

const optionalTitle = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? "Untitled homework" : trimmed;
}, z.string().trim().max(200, "Title is too long"));

export const homeworkInputSchema = z.object({
  studentId: z.string().uuid("Choose a student"),
  lessonId: optionalUuid,
  subjectId: optionalUuid,
  title: optionalTitle,
  description: optionalTrimmed(4000, "Description is too long"),
  dueDate: optionalDate,
  links: linkListSchema,
});

export type HomeworkInput = z.infer<typeof homeworkInputSchema>;
export type HomeworkLink = { label: string | null; url: string };

export const submissionInputSchema = z.object({
  submissionText: z.string().trim().min(1, "Enter what the student submitted").max(4000),
});

export const feedbackInputSchema = z.object({
  feedbackText: z.string().trim().min(1, "Enter feedback").max(4000),
});
