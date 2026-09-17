"use client";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Critically damped by default: settle cleanly, no overshoot, for anything that isn't gesture-driven. */
export const SPRING_SETTLE = { type: "spring", bounce: 0, duration: 0.32 } as const;

/** Slightly faster settle for small/close surfaces (popovers, dropdowns). */
export const SPRING_POP = { type: "spring", bounce: 0, duration: 0.22 } as const;
