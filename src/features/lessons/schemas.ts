import { z } from "zod";

export const LESSON_STATUSES = ["scheduled", "completed", "cancelled", "no_show"] as const;

export type LessonStatus = (typeof LESSON_STATUSES)[number];

const optionalTrimmedNotes = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().trim().max(4000, "Notes are too long").optional());

const uuid = z.string().uuid("Choose a student");

const isoDateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Enter a valid date and time",
});

export const lessonInputSchema = z
  .object({
    studentId: uuid,
    startTime: isoDateTime,
    endTime: isoDateTime,
    notes: optionalTrimmedNotes,
  })
  .refine((value) => new Date(value.endTime) > new Date(value.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type LessonInput = z.infer<typeof lessonInputSchema>;

export const lessonStatusSchema = z.enum(LESSON_STATUSES);
