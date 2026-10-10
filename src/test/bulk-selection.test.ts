import { describe, expect, it } from "vitest";
import {
  bulkAllMatchingMessage,
  canOfferAllMatching,
  listSelectionKey,
} from "../features/lessons/bulk-selection";
import {
  bulkPaymentAllMatchingSchema,
  MAX_BULK_ALL_MATCHING,
  parseLessonListFilters,
} from "../features/lessons/schemas";

const UUID = "3f2b8c1e-5a4d-4e6f-9a7b-1c2d3e4f5a6b";

describe("canOfferAllMatching", () => {
  it("offers only when the whole page is selected and more rows exist", () => {
    expect(canOfferAllMatching(50, 50, 130)).toBe(true);
    expect(canOfferAllMatching(49, 50, 130)).toBe(false);
    expect(canOfferAllMatching(50, 50, 50)).toBe(false);
    expect(canOfferAllMatching(0, 0, 0)).toBe(false);
  });
});

describe("listSelectionKey", () => {
  const base = {
    status: "all",
    student: "all",
    subject: "all",
    payment: "unpaid",
    sortKey: "date",
    sortDir: "desc",
    pageSize: 50,
  };
  it("changes when any filter, sort or page size changes", () => {
    const key = listSelectionKey(base);
    expect(listSelectionKey({ ...base })).toBe(key);
    for (const change of [
      { status: "completed" },
      { student: UUID },
      { subject: UUID },
      { payment: "paid" },
      { sortKey: "student" },
      { sortDir: "asc" },
      { pageSize: 100 },
    ]) {
      expect(listSelectionKey({ ...base, ...change })).not.toBe(key);
    }
  });
});

describe("parseLessonListFilters", () => {
  it("accepts valid values", () => {
    expect(
      parseLessonListFilters({
        status: "completed",
        student: UUID,
        subject: UUID,
        payment: "unpaid",
      }),
    ).toEqual({ status: "completed", studentId: UUID, subjectId: UUID, payment: "unpaid" });
  });
  it("ignores invalid values and defaults payment to all", () => {
    expect(
      parseLessonListFilters({ status: "x", student: "not-a-uuid", subject: "", payment: "zzz" }),
    ).toEqual({ status: undefined, studentId: undefined, subjectId: undefined, payment: "all" });
    expect(parseLessonListFilters({}).payment).toBe("all");
  });
});

describe("bulkPaymentAllMatchingSchema", () => {
  it("requires a valid target status and a positive integer count", () => {
    const ok = { filters: {}, paymentStatus: "paid", expectedCount: 120 };
    expect(bulkPaymentAllMatchingSchema.safeParse(ok).success).toBe(true);
    expect(bulkPaymentAllMatchingSchema.safeParse({ ...ok, paymentStatus: "x" }).success).toBe(
      false,
    );
    expect(bulkPaymentAllMatchingSchema.safeParse({ ...ok, expectedCount: 0 }).success).toBe(false);
    expect(bulkPaymentAllMatchingSchema.safeParse({ ...ok, expectedCount: 1.5 }).success).toBe(
      false,
    );
  });
  it("has a 2000 sanity cap", () => {
    expect(MAX_BULK_ALL_MATCHING).toBe(2000);
  });
});

describe("bulkAllMatchingMessage", () => {
  it("reports the updated count and skipped rows", () => {
    expect(bulkAllMatchingMessage(120, 120, "paid")).toBe("120 lessons marked paid.");
    expect(bulkAllMatchingMessage(1, 1, "unpaid")).toBe("1 lesson marked unpaid.");
    expect(bulkAllMatchingMessage(100, 130, "paid")).toBe(
      "100 lessons marked paid. 30 already paid.",
    );
  });
});
