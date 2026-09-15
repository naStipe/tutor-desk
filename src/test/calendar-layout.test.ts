import { describe, expect, it } from "vitest";
import { layoutDayIntervals } from "../features/lessons/calendar-layout";

describe("layoutDayIntervals", () => {
  it("gives a single, non-overlapping interval the full column", () => {
    const layout = layoutDayIntervals([{ id: "a", startMinutes: 60, endMinutes: 120 }]);
    expect(layout.get("a")).toEqual({ id: "a", column: 0, columns: 1 });
  });

  it("splits two overlapping intervals into side-by-side columns", () => {
    const layout = layoutDayIntervals([
      { id: "a", startMinutes: 60, endMinutes: 120 },
      { id: "b", startMinutes: 90, endMinutes: 150 },
    ]);
    expect(layout.get("a")).toEqual({ id: "a", column: 0, columns: 2 });
    expect(layout.get("b")).toEqual({ id: "b", column: 1, columns: 2 });
  });

  it("does not group intervals that don't overlap into the same cluster", () => {
    const layout = layoutDayIntervals([
      { id: "a", startMinutes: 60, endMinutes: 120 },
      { id: "b", startMinutes: 180, endMinutes: 240 },
    ]);
    expect(layout.get("a")).toEqual({ id: "a", column: 0, columns: 1 });
    expect(layout.get("b")).toEqual({ id: "b", column: 0, columns: 1 });
  });

  it("reuses a freed-up column once an earlier interval in the cluster has ended", () => {
    const layout = layoutDayIntervals([
      { id: "a", startMinutes: 60, endMinutes: 90 },
      { id: "b", startMinutes: 60, endMinutes: 150 },
      { id: "c", startMinutes: 100, endMinutes: 130 },
    ]);
    // "b" is longer, so it sorts first and claims column 0; "a" ends earliest and frees its
    // column for "c" to reuse.
    expect(layout.get("b")?.column).toBe(0);
    expect(layout.get("a")?.column).toBe(1);
    expect(layout.get("c")?.column).toBe(1);
    expect(layout.get("a")?.columns).toBe(2);
    expect(layout.get("b")?.columns).toBe(2);
    expect(layout.get("c")?.columns).toBe(2);
  });

  it("chains transitively-overlapping intervals into one cluster with a shared column count", () => {
    const layout = layoutDayIntervals([
      { id: "a", startMinutes: 0, endMinutes: 100 },
      { id: "b", startMinutes: 50, endMinutes: 150 },
      { id: "c", startMinutes: 140, endMinutes: 200 },
    ]);
    expect(layout.get("a")?.columns).toBe(2);
    expect(layout.get("b")?.columns).toBe(2);
    expect(layout.get("c")?.columns).toBe(2);
  });
});
