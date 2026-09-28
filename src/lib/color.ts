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
