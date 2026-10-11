"use client";

import { useEffect, useState } from "react";
import { Badge, type BadgeTone } from "../../../components/Badge";
import { type DisplayStatus, displayStatus } from "../status";

const STATUS_TONES: Record<DisplayStatus, BadgeTone> = {
  scheduled: "cyan",
  in_progress: "violet",
  completed: "brand",
  cancelled: "neutral",
  no_show: "warning",
};

const STATUS_LABELS: Record<DisplayStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

/**
 * Pass `startTime`/`endTime` to get the live status (in progress, or completed once the lesson has
 * ended). Until mounted it shows the stored status, so server and first client render match.
 */
export function StatusBadge({
  status,
  startTime,
  endTime,
}: {
  status: string;
  startTime?: string;
  endTime?: string;
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    if (!startTime || !endTime) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  const stored = (status in STATUS_TONES ? status : "scheduled") as DisplayStatus;
  const key =
    startTime && endTime && nowMs !== null
      ? displayStatus(stored, startTime, endTime, nowMs)
      : stored;
  return <Badge tone={STATUS_TONES[key]}>{STATUS_LABELS[key]}</Badge>;
}
