"use client";

import type { HTMLAttributes, PointerEvent } from "react";

// Sets --mx/--my on the card so the .td-spot CSS can draw a glow that follows the cursor.
export function SpotlightCard({
  className = "",
  onPointerMove,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  function handleMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
    onPointerMove?.(event);
  }

  return (
    <div
      onPointerMove={handleMove}
      className={`td-spot rounded-2xl border border-border bg-surface ${className}`}
      {...props}
    />
  );
}
