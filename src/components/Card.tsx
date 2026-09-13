import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-6 shadow-sm shadow-black/[0.03] transition-shadow duration-200 ${className}`}
      {...props}
    />
  );
}
