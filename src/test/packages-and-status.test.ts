import { describe, expect, it } from "vitest";
import { computePackageBalance } from "../features/packages/balance";
import { packageInputSchema } from "../features/packages/schemas";
import { displayStatus } from "../features/lessons/status";

const START = "2026-10-11T10:00:00.000Z";
const END = "2026-10-11T11:00:00.000Z";
const at = (iso: string) => Date.parse(iso);

describe("displayStatus", () => {
  it("keeps a future scheduled lesson scheduled", () => {
    expect(displayStatus("scheduled", START, END, at("2026-10-11T09:59:59.000Z"))).toBe(
      "scheduled",
    );
  });

  it("is in progress from the start until the end", () => {
    expect(displayStatus("scheduled", START, END, at(START))).toBe("in_progress");
    expect(displayStatus("scheduled", START, END, at("2026-10-11T10:59:59.000Z"))).toBe(
      "in_progress",
    );
  });

  it("is completed once the end time passes", () => {
    expect(displayStatus("scheduled", START, END, at(END))).toBe("completed");
  });

  it("never changes a non-scheduled status", () => {
    for (const status of ["completed", "cancelled", "no_show"]) {
      expect(displayStatus(status, START, END, at("2026-10-11T10:30:00.000Z"))).toBe(status);
    }
  });

  it("falls back to scheduled on unparseable times", () => {
    expect(displayStatus("scheduled", "nope", END, Date.now())).toBe("scheduled");
  });
});

describe("computePackageBalance", () => {
  it("separates booked, used and remaining", () => {
    const balance = computePackageBalance(
      [10],
      ["scheduled", "scheduled", "completed", "no_show", "completed"],
    );
    expect(balance).toEqual({ total: 10, booked: 2, used: 3, remaining: 5 });
  });

  it("does not count cancelled lessons", () => {
    expect(computePackageBalance([5], ["cancelled", "scheduled"]).remaining).toBe(4);
  });

  it("sums several packages and never goes negative", () => {
    expect(computePackageBalance([2, 3], []).total).toBe(5);
    expect(computePackageBalance([1], ["scheduled", "scheduled"]).remaining).toBe(0);
  });
});

describe("packageInputSchema", () => {
  const studentId = "5f4f3a52-3b1f-4f5b-9a55-7c1f4f1a2b3c";

  it("accepts a package with an optional price", () => {
    const parsed = packageInputSchema.safeParse({
      studentId,
      totalLessons: "10",
      price: "",
      currency: "",
      note: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.totalLessons).toBe(10);
      expect(parsed.data.price).toBeUndefined();
    }
  });

  it("rejects zero, fractional and oversized counts", () => {
    for (const totalLessons of ["0", "2.5", "1001", ""]) {
      expect(packageInputSchema.safeParse({ studentId, totalLessons }).success).toBe(false);
    }
  });

  it("rejects a foreign-shaped student id", () => {
    expect(packageInputSchema.safeParse({ studentId: "x", totalLessons: "5" }).success).toBe(false);
  });
});
