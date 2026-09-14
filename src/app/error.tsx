"use client";

import { useEffect } from "react";
import { buttonClassName } from "../components/Button";

export default function GlobalErrorBoundary({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-muted p-6 text-center">
      <p className="text-lg font-semibold text-ink">Something went wrong</p>
      <p className="max-w-sm text-sm text-ink-muted">
        That page hit an unexpected error. It's usually transient — try again, and if it keeps
        happening, head back to the dashboard.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => reset()} className={buttonClassName("primary")}>
          Try again
        </button>
        <a href="/dashboard" className={buttonClassName("secondary")}>
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
