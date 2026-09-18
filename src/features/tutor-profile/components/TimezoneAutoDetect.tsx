"use client";

import { useEffect } from "react";
import { autoDetectTimezoneAction } from "../actions";

/**
 * Renders nothing. On mount, tells the server what timezone the browser resolves to, so a
 * freshly created profile (still on the "UTC" default) picks it up without the tutor ever
 * opening Settings. Safe to mount on every dashboard load — the server action only writes once,
 * before the tutor has saved any settings of their own.
 */
export function TimezoneAutoDetect() {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) void autoDetectTimezoneAction(timezone);
  }, []);

  return null;
}
