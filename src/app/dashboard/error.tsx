"use client";

import { useEffect } from "react";
import { buttonClassName } from "../../components/Button";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface p-10 text-center">
      <p className="text-base font-semibold text-ink">This page hit an unexpected error</p>
      <p className="max-w-sm text-sm text-ink-muted">
        Usually a transient glitch — try again.
      </p>
      <button type="button" onClick={() => reset()} className={buttonClassName("primary")}>
        Try again
      </button>
    </div>
  );
}
