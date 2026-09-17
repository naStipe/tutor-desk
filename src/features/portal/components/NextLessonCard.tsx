"use client";

import { useEffect, useState } from "react";
import { buttonClassName } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { formatFullDateTime } from "../../lessons/date-utils";

function formatCountdown(ms: number) {
  if (ms <= 0) return "Starting now";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h ${minutes}m`;
  return `In ${minutes}m`;
}

export function NextLessonCard({
  startTime,
  endTime,
  subjectName,
  meetingUrl,
  timeZone,
}: {
  startTime: string;
  endTime: string;
  subjectName: string | null;
  meetingUrl: string | null;
  timeZone: string;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const start = new Date(startTime);
  const end = new Date(endTime);
  const hasStarted = now >= start;
  const hasEnded = now >= end;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Next lesson</h2>
        {!hasEnded && (
          <span className="text-xs font-medium text-brand">
            {hasStarted ? "In progress" : formatCountdown(start.getTime() - now.getTime())}
          </span>
        )}
      </div>
      <p className="text-sm text-ink-muted">{formatFullDateTime(startTime, timeZone)}</p>
      {subjectName && <p className="text-sm text-ink-subtle">{subjectName}</p>}
      {meetingUrl && !hasEnded && (
        <a href={meetingUrl} target="_blank" rel="noreferrer" className={buttonClassName("primary", "w-fit")}>
          Join lesson
        </a>
      )}
    </Card>
  );
}
