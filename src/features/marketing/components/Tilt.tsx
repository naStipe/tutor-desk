"use client";

import type { HTMLAttributes, PointerEvent } from "react";

// 3D tilt that follows the pointer. Sets --rx/--ry; the .td-tilt CSS turns them into a transform.
export function Tilt({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${(px * 8).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * 6).toFixed(2)}deg`);
  }
  function reset(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.removeProperty("--ry");
    event.currentTarget.style.removeProperty("--rx");
  }
  return (
    <div
      onPointerMove={move}
      onPointerLeave={reset}
      className={`td-tilt ${className}`}
      {...props}
    />
  );
}
