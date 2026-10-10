/**
 * Deterministic hue assignment shared by anything that needs a stable, per-entity color without a
 * database column — `Avatar` (color by student/tutor name) and the lesson calendar (color lesson
 * blocks by student). Cycles through the same brand hues so colors stay consistent with the rest of
 * the design-token system in both light and dark themes.
 */
export const BRAND_HUES = ["brand", "cyan", "violet", "warning"] as const;

export type BrandHue = (typeof BRAND_HUES)[number];

export function hashToHue(key: string): BrandHue {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return BRAND_HUES[hash % BRAND_HUES.length];
}

/**
 * Wider palette for the lesson calendar, where several students are visible at once. The first
 * four are the brand hues (same tokens as `Avatar`); the rest are extra `--color-hue-*` design
 * tokens. Ordered around the color wheel so neighbouring entries stay visually distinct.
 */
export const STUDENT_HUES = [
  "brand",
  "blue",
  "violet",
  "pink",
  "orange",
  "warning",
  "lime",
  "cyan",
] as const;

export type StudentHue = (typeof STUDENT_HUES)[number];

function hashString(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic hue for one id; the same id always gives the same hue. */
export function studentHue(id: string): StudentHue {
  return STUDENT_HUES[hashString(id) % STUDENT_HUES.length];
}

/**
 * Hue per id for a set of students shown together. Each id starts at its own `studentHue` and, if
 * another id already took that hue, moves to the next free one, so up to `STUDENT_HUES.length`
 * students are all distinct (beyond that, hues repeat). Ids are processed in sorted order, so the
 * result depends only on the set of ids, not on the order they are passed in. Nothing is stored.
 */
export function assignStudentHues(ids: Iterable<string>): Map<string, StudentHue> {
  const unique = [...new Set(ids)].sort();
  const taken = new Set<StudentHue>();
  const result = new Map<string, StudentHue>();
  for (const id of unique) {
    const start = STUDENT_HUES.indexOf(studentHue(id));
    let hue = STUDENT_HUES[start];
    if (taken.size < STUDENT_HUES.length) {
      for (let step = 0; step < STUDENT_HUES.length; step++) {
        const candidate = STUDENT_HUES[(start + step) % STUDENT_HUES.length];
        if (!taken.has(candidate)) {
          hue = candidate;
          break;
        }
      }
    }
    taken.add(hue);
    result.set(id, hue);
  }
  return result;
}
