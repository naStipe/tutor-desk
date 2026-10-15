"use client";

import { useEffect, useState } from "react";

// Shown once after account deletion (`/?notice=account-deleted`). Read on the client so the
// landing page stays statically rendered.
export function AccountDeletedNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("notice") === "account-deleted") {
      setVisible(true);
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="td-fade-in-up border-b border-border bg-surface px-4 py-3 text-center text-sm text-ink"
    >
      Your account and data have been deleted.{" "}
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="td-link min-h-11 px-2 font-medium text-brand sm:min-h-0 sm:px-0"
      >
        Dismiss
      </button>
    </div>
  );
}
