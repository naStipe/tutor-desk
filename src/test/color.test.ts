import { describe, expect, it } from "vitest";
import { assignStudentHues, STUDENT_HUES, studentHue } from "../lib/color";

function uuid(n: number) {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

describe("studentHue", () => {
  it("returns the same hue for the same id", () => {
    const id = "6f9619ff-8b86-d011-b42d-00cf4fc964ff";
    expect(studentHue(id)).toBe(studentHue(id));
    expect(STUDENT_HUES).toContain(studentHue(id));
  });

  it("spreads many ids across the whole palette", () => {
    const used = new Set(Array.from({ length: 200 }, (_, i) => studentHue(uuid(i * 7919))));
    expect(used.size).toBe(STUDENT_HUES.length);
  });
});

describe("assignStudentHues", () => {
  it("gives every student a distinct hue up to the palette size", () => {
    for (let offset = 0; offset < 50; offset++) {
      const ids = Array.from({ length: STUDENT_HUES.length }, (_, i) => uuid(offset * 100 + i));
      const hues = assignStudentHues(ids);
      expect(new Set(hues.values()).size).toBe(STUDENT_HUES.length);
    }
  });

  it("does not depend on input order and ignores duplicates", () => {
    const ids = [uuid(1), uuid(2), uuid(3), uuid(4), uuid(5)];
    const forward = assignStudentHues(ids);
    const backward = assignStudentHues([...ids].reverse().concat(ids));
    expect([...forward]).toEqual([...backward]);
  });

  it("repeats hues instead of failing when there are more students than hues", () => {
    const ids = Array.from({ length: STUDENT_HUES.length + 3 }, (_, i) => uuid(i));
    const hues = assignStudentHues(ids);
    expect(hues.size).toBe(ids.length);
    for (const hue of hues.values()) expect(STUDENT_HUES).toContain(hue);
  });
});
