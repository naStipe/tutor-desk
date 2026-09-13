import { describe, expect, it } from "vitest";
import {
  feedbackInputSchema,
  homeworkInputSchema,
  submissionInputSchema,
} from "../features/homework/schemas";

const studentId = "11111111-1111-4111-8111-111111111111";

describe("homework input", () => {
  it("accepts a minimal homework assignment", () => {
    const parsed = homeworkInputSchema.parse({ studentId, title: "  Read chapter 3  " });
    expect(parsed.title).toBe("Read chapter 3");
    expect(parsed.lessonId).toBeUndefined();
    expect(parsed.dueDate).toBeUndefined();
  });

  it("requires a non-empty title", () => {
    expect(homeworkInputSchema.safeParse({ studentId, title: "  " }).success).toBe(false);
  });

  it("requires a valid student id", () => {
    expect(
      homeworkInputSchema.safeParse({ studentId: "not-a-uuid", title: "Homework" }).success,
    ).toBe(false);
  });

  it("rejects an invalid due date when supplied", () => {
    expect(
      homeworkInputSchema.safeParse({ studentId, title: "Homework", dueDate: "not-a-date" })
        .success,
    ).toBe(false);
  });
});

describe("submission and feedback input", () => {
  it("requires non-empty submission text", () => {
    expect(submissionInputSchema.safeParse({ submissionText: "  " }).success).toBe(false);
    expect(submissionInputSchema.parse({ submissionText: "Done" }).submissionText).toBe("Done");
  });

  it("requires non-empty feedback text", () => {
    expect(feedbackInputSchema.safeParse({ feedbackText: "" }).success).toBe(false);
    expect(feedbackInputSchema.parse({ feedbackText: "Great work" }).feedbackText).toBe(
      "Great work",
    );
  });
});
