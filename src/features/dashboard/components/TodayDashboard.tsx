"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatCountdown,
  formatDuration,
  formatEyebrowDate,
  formatOverdue,
  formatRelativePast,
  greetingWord,
} from "../format";
import { Sparkline } from "./Sparkline";

export type TodayLesson = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  studentId: string | null;
  studentName: string;
};

export type HomeworkAttentionItem = {
  id: string;
  title: string;
  studentName: string;
  overdue: boolean;
  submittedAt: string | null;
  dueDate: string | null;
};

export type TodayDashboardProps = {
  firstName: string;
  lessons: TodayLesson[];
  homework: HomeworkAttentionItem[];
  unbilled: { count: number; oldestDate: string | null };
  weekLoad: { lessonCount: number; totalMinutes: number; perDayMinutes: number[] };
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function daysAgo(now: Date, iso: string) {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000));
  return days;
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[7px] border border-[var(--td2-border-chip)] bg-[var(--td2-bg-inset)] px-[9px] py-1 font-mono text-[11px] text-[var(--td2-text-secondary)]">
      {children}
    </span>
  );
}

function SchedulePill({
  label,
}: {
  label: "DONE" | "UP NEXT" | "IN PROGRESS" | "NO PLAN" | "CANCELLED";
}) {
  const base = "shrink-0 rounded-[20px] px-[9px] py-[3px] font-mono text-[10px] tracking-[0.08em]";
  if (label === "UP NEXT" || label === "IN PROGRESS")
    return (
      <span
        className={`${base} font-medium bg-[var(--td2-primary-bg)] text-[var(--td2-primary-fg)]`}
      >
        {label}
      </span>
    );
  if (label === "NO PLAN")
    return (
      <span
        className={`${base} border border-[var(--td2-attention-border)] text-[var(--td2-attention)]`}
      >
        NO PLAN
      </span>
    );
  return (
    <span className={`${base} border border-[var(--td2-border-chip)] text-[var(--td2-text-faint)]`}>
      {label}
    </span>
  );
}

function GreetingHeader({ now, firstName }: { now: Date; firstName: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p
          suppressHydrationWarning
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--td2-text-muted)]"
        >
          {formatEyebrowDate(now)}
        </p>
        <h1
          suppressHydrationWarning
          className="mt-2 text-[30px] font-bold leading-none tracking-[-0.035em] text-[var(--td2-text-primary)] lg:text-[40px]"
        >
          {greetingWord(now)}, {firstName}.
        </h1>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          disabled
          title="Search isn't wired up yet"
          className="flex w-[170px] cursor-not-allowed items-center gap-2 rounded-[11px] border border-[var(--td2-border-card)] bg-[var(--td2-bg-field)] px-3.5 py-2.5 text-left text-[13px] text-[var(--td2-text-faint)] sm:w-[190px]"
        >
          <span className="font-mono">/</span>
          Search students
        </button>
        <Link
          href="/dashboard/schedule?create=1"
          className="inline-flex items-center rounded-[11px] bg-[var(--td2-primary-bg)] px-[18px] py-[11px] text-[14px] font-medium text-[var(--td2-primary-fg)] transition-[transform,filter] duration-150 hover:-translate-y-0.5 hover:brightness-110"
        >
          + New lesson
        </Link>
      </div>
    </div>
  );
}

function HeroLesson({
  now,
  lesson,
  prepLesson,
}: {
  now: Date;
  lesson?: TodayLesson;
  prepLesson?: TodayLesson;
}) {
  if (!lesson) {
    return (
      <div className="relative flex flex-col justify-center gap-2 overflow-hidden rounded-[18px] border border-[var(--td2-border-card)] bg-[var(--td2-bg-card)] p-[26px_28px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--td2-text-muted)]">
          Today
        </p>
        <p className="text-[22px] font-bold tracking-[-0.02em] text-[var(--td2-text-primary)]">
          Nothing left today.
        </p>
        <p className="text-[13px] text-[var(--td2-text-muted)]">
          {prepLesson
            ? "One lesson still needs a plan — see Prep queue."
            : "Enjoy the rest of your day."}
        </p>
      </div>
    );
  }

  const start = new Date(lesson.startTime);
  const end = new Date(lesson.endTime);
  const inProgress = now >= start && now < end;
  const soon = now < start && start.getTime() - now.getTime() <= 15 * 60000;

  return (
    <div className="group relative flex flex-col gap-[22px] overflow-hidden rounded-[18px] border border-[var(--td2-border-card)] bg-[var(--td2-bg-card)] p-[26px_28px] transition-colors duration-200 hover:border-[var(--td2-accent-surface-border)]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[70px] -top-[70px] h-[220px] w-[220px] rounded-full bg-[var(--td2-accent)] opacity-[0.18] dark:opacity-[0.07]"
      />

      <div className="relative flex items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--td2-accent-text-strong)]">
          Next lesson
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--td2-text-muted)]">
          <span
            aria-hidden="true"
            className="td-pulse-dot h-[7px] w-[7px] rounded-full bg-[var(--td2-accent-dot)]"
          />
          <span suppressHydrationWarning>{formatCountdown(now, start, end)}</span>
        </span>
      </div>

      <div className="relative flex items-end gap-5">
        <span className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[16px] border border-[var(--td2-border-card)] bg-[var(--td2-bg-inset-2)] text-[20px] font-medium text-[var(--td2-text-secondary)]">
          {initials(lesson.studentName)}
        </span>
        <div>
          <p className="text-[32px] font-bold leading-none tracking-[-0.04em] text-[var(--td2-text-primary)] lg:text-[36px] xl:text-[44px]">
            {lesson.studentName}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip>
              {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} —{" "}
              {end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </Chip>
            {lesson.notes && <Chip>Has a plan</Chip>}
          </div>
        </div>
      </div>

      <div className="relative flex flex-wrap gap-2.5">
        <button
          type="button"
          disabled
          title="No meeting link on this lesson"
          className={`w-full rounded-[11px] bg-[var(--td2-primary-bg)] px-5 py-3 text-[14px] font-medium text-[var(--td2-primary-fg)] opacity-50 sm:w-auto ${
            soon || inProgress ? "td-ring" : ""
          }`}
        >
          Join Google Meet
        </button>
        <Link
          href={`/dashboard/lessons/${lesson.id}`}
          className="rounded-[11px] border border-[var(--td2-border-strong)] px-[18px] py-3 text-[14px] text-[var(--td2-text-primary)] transition-colors hover:bg-[var(--td2-bg-inset)]"
        >
          Open lesson plan
        </Link>
        <Link
          href={`/dashboard/lessons/${lesson.id}`}
          className="rounded-[11px] border border-[var(--td2-border-strong)] px-3.5 py-3 text-[14px] text-[var(--td2-text-muted)] transition-colors hover:bg-[var(--td2-bg-inset)] hover:text-[var(--td2-text-primary)]"
        >
          Reschedule
        </Link>
      </div>

      <div className="relative border-t border-[var(--td2-border-hairline)] pt-4 text-[13px] text-[var(--td2-text-muted)]">
        {lesson.notes ? (
          <>
            Has a lesson plan ready ·{" "}
            <span className="text-[var(--td2-text-primary)]">on track for today</span>
          </>
        ) : (
          <>
            No lesson plan yet ·{" "}
            <span className="text-[var(--td2-text-primary)]">
              write one before {initials(lesson.studentName)} joins
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function StatBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-2 rounded-[18px] border border-[var(--td2-border-card)] bg-[var(--td2-bg-card)] p-[22px_24px] transition-transform duration-200 hover:-translate-y-[3px]">
      {children}
    </div>
  );
}

function StatsStack({
  now,
  unbilled,
  weekLoad,
}: {
  now: Date;
  unbilled: { count: number; oldestDate: string | null };
  weekLoad: { lessonCount: number; totalMinutes: number; perDayMinutes: number[] };
}) {
  const oldestDays = unbilled.oldestDate ? daysAgo(now, unbilled.oldestDate) : null;
  const todayIndex = (now.getDay() + 6) % 7;

  return (
    <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-[18px]">
      <Link href="/dashboard/lessons">
        <StatBlock>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--td2-text-muted)]">
            Unbilled
          </p>
          <div>
            <p className="text-[30px] font-bold tracking-[-0.03em] text-[var(--td2-text-primary)] lg:text-[38px]">
              {unbilled.count}
            </p>
            <p className="mt-1.5 text-[13px] text-[var(--td2-text-muted)]">
              completed lesson{unbilled.count === 1 ? "" : "s"}
              {oldestDays !== null && oldestDays > 0 ? ` · oldest ${oldestDays}d` : ""}
            </p>
          </div>
        </StatBlock>
      </Link>
      <StatBlock>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--td2-text-muted)]">
          This week
        </p>
        <div>
          <p className="flex items-baseline gap-2">
            <span className="text-[30px] font-bold tracking-[-0.03em] text-[var(--td2-text-primary)] lg:text-[38px]">
              {weekLoad.lessonCount}
            </span>
            <span className="text-[14px] text-[var(--td2-text-muted)]">
              lessons · {formatDuration(weekLoad.totalMinutes)}
            </span>
          </p>
          <div className="mt-2.5">
            <Sparkline values={weekLoad.perDayMinutes} activeIndex={todayIndex} />
          </div>
        </div>
      </StatBlock>
    </div>
  );
}

function ScheduleCard({
  now,
  lessons,
  nextLessonId,
}: {
  now: Date;
  lessons: TodayLesson[];
  nextLessonId?: string;
}) {
  const totalMinutes = lessons.reduce((sum, lesson) => {
    if (lesson.status === "cancelled") return sum;
    return (
      sum + (new Date(lesson.endTime).getTime() - new Date(lesson.startTime).getTime()) / 60000
    );
  }, 0);

  return (
    <div className="rounded-[18px] border border-[var(--td2-border-card)] bg-[var(--td2-bg-card)] p-[20px] lg:p-[22px_24px]">
      <div className="mb-[18px] flex items-baseline justify-between">
        <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[var(--td2-text-primary)]">
          Today&apos;s schedule
        </h2>
        <span className="font-mono text-[11px] text-[var(--td2-text-muted)]">
          {lessons.length} lesson{lessons.length === 1 ? "" : "s"} · {formatDuration(totalMinutes)}
        </span>
      </div>

      {lessons.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[12px] border border-dashed border-[var(--td2-border-strong)] py-10 text-center">
          <p className="text-sm text-[var(--td2-text-muted)]">No lessons today.</p>
          <Link
            href="/dashboard/schedule?create=1"
            className="inline-flex items-center rounded-[11px] bg-[var(--td2-primary-bg)] px-4 py-2 text-[13px] font-medium text-[var(--td2-primary-fg)]"
          >
            Schedule a lesson
          </Link>
        </div>
      ) : (
        <div>
          {lessons.map((lesson) => {
            const start = new Date(lesson.startTime);
            const end = new Date(lesson.endTime);
            const isNext = lesson.id === nextLessonId;
            const inProgress = isNext && now >= start && now < end;
            const cancelled = lesson.status === "cancelled";
            const past = end <= now && lesson.status !== "scheduled";

            let pillLabel: "DONE" | "UP NEXT" | "IN PROGRESS" | "NO PLAN" | "CANCELLED" | null =
              null;
            if (cancelled) pillLabel = "CANCELLED";
            else if (lesson.status === "completed" || lesson.status === "no_show")
              pillLabel = "DONE";
            else if (isNext) pillLabel = inProgress ? "IN PROGRESS" : "UP NEXT";
            else if (!lesson.notes) pillLabel = "NO PLAN";

            const dimmed = past && !isNext;

            return (
              <Link
                key={lesson.id}
                href={`/dashboard/lessons/${lesson.id}`}
                className={`grid grid-cols-[56px_1fr_auto] items-center gap-4 border-t border-[var(--td2-border-hairline)] py-[13px] first:border-t-0 sm:grid-cols-[64px_1fr_auto] ${
                  isNext
                    ? "-mx-[14px] my-1.5 rounded-[12px] border-t-0 bg-[var(--td2-accent-surface)] px-[14px] py-[15px]"
                    : "hover:bg-[var(--td2-bg-row-hover)]"
                }`}
              >
                <span
                  className={`font-mono text-[13px] ${cancelled ? "line-through" : ""} ${
                    isNext
                      ? "font-medium text-[var(--td2-accent-text)]"
                      : dimmed
                        ? "text-[var(--td2-text-faint)]"
                        : "text-[var(--td2-text-secondary)]"
                  }`}
                >
                  {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-[11px] ${
                      isNext
                        ? "bg-[var(--td2-primary-bg)] text-[var(--td2-primary-fg)]"
                        : "bg-[var(--td2-bg-inset-2)] text-[var(--td2-text-secondary)]"
                    }`}
                  >
                    {initials(lesson.studentName)}
                  </span>
                  <span
                    className={`truncate ${isNext ? "text-[15px] font-medium" : "text-sm"} ${
                      cancelled
                        ? "line-through text-[var(--td2-text-faint)]"
                        : dimmed
                          ? "text-[var(--td2-text-faint)]"
                          : "text-[var(--td2-text-primary)]"
                    }`}
                  >
                    {lesson.studentName}
                  </span>
                </span>
                {pillLabel && <SchedulePill label={pillLabel} />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NeedsReviewCard({ now, items }: { now: Date; items: HomeworkAttentionItem[] }) {
  return (
    <div className="rounded-[18px] border border-[var(--td2-border-card)] bg-[var(--td2-bg-card)] p-[20px] lg:p-[22px_24px]">
      <div className="mb-4 flex items-center gap-2.5">
        <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[var(--td2-text-primary)]">
          Needs review
        </h2>
        {items.length > 0 && (
          <span className="rounded-[20px] bg-[var(--td2-attention)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--td2-attention-ink)]">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--td2-text-muted)]">All caught up.</p>
      ) : (
        <div>
          {items.map(({ id, title, studentName, overdue, submittedAt, dueDate }) => (
            <Link
              key={id}
              href={`/dashboard/homework/${id}`}
              className="flex items-center justify-between gap-3 border-t border-[var(--td2-border-hairline)] py-3 first:border-t-0 hover:bg-[var(--td2-bg-row-hover)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--td2-text-primary)]">
                  {title}
                </p>
                <p
                  suppressHydrationWarning
                  className={`mt-1 font-mono text-[11px] ${overdue ? "text-[var(--td2-attention)]" : "text-[var(--td2-text-muted)]"}`}
                >
                  {studentName} ·{" "}
                  {overdue
                    ? formatOverdue(now, dueDate ?? now.toISOString())
                    : formatRelativePast(now, submittedAt ?? now.toISOString())}
                </p>
              </div>
              <span className="shrink-0 border-b border-[var(--td2-accent-underline)] pb-0.5 text-[13px] text-[var(--td2-accent-text)]">
                {overdue ? "Nudge" : "Review"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function PrepQueueCard({ lesson }: { lesson?: TodayLesson }) {
  if (!lesson) {
    return (
      <div className="rounded-[18px] bg-[var(--td2-bg-inset)] p-[22px_24px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--td2-text-muted)]">
          Prep queue
        </p>
        <p className="mt-2.5 text-[15px] text-[var(--td2-text-secondary)]">
          Every upcoming lesson has a plan.
        </p>
      </div>
    );
  }

  const start = new Date(lesson.startTime);

  return (
    <div className="rounded-[18px] bg-[var(--td2-primary-bg)] p-[22px_24px] text-[var(--td2-primary-fg)]">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] opacity-70">Prep queue</p>
      <p className="mt-2.5 text-[17px] font-medium leading-[1.35]">
        {lesson.studentName}&apos;s{" "}
        {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} lesson has no
        plan yet.
      </p>
      <Link
        href={`/dashboard/lessons/${lesson.id}`}
        className="mt-4 inline-flex rounded-[9px] bg-[var(--td2-primary-fg)] px-3.5 py-[9px] text-[13px] text-[var(--td2-primary-bg)] transition-[filter] duration-150 hover:brightness-110"
      >
        Write plan · 8 min
      </Link>
    </div>
  );
}

export function TodayDashboard({
  firstName,
  lessons,
  homework,
  unbilled,
  weekLoad,
}: TodayDashboardProps) {
  const now = useNow(30000);

  const nextLesson = lessons.find(
    (lesson) => lesson.status === "scheduled" && new Date(lesson.endTime) > now,
  );
  const prepLesson = lessons.find(
    (lesson) =>
      lesson.status === "scheduled" &&
      new Date(lesson.endTime) > now &&
      (!lesson.notes || lesson.notes.trim() === ""),
  );

  return (
    <div className="flex flex-col gap-[18px] p-5 sm:px-[34px] sm:py-[30px] lg:gap-y-[26px] lg:grid lg:grid-cols-[1.4fr_1fr] xl:grid-cols-[1.7fr_1fr]">
      <div className="order-1 lg:order-none lg:col-span-2">
        <GreetingHeader now={now} firstName={firstName} />
      </div>

      <div className="order-2 lg:order-none lg:col-start-1 lg:row-start-2">
        <HeroLesson now={now} lesson={nextLesson} prepLesson={prepLesson} />
      </div>

      <div className="order-6 lg:order-none lg:col-start-2 lg:row-start-2">
        <StatsStack now={now} unbilled={unbilled} weekLoad={weekLoad} />
      </div>

      <div className="order-4 lg:order-none lg:col-start-1 lg:row-start-3">
        <ScheduleCard now={now} lessons={lessons} nextLessonId={nextLesson?.id} />
      </div>

      <div className="order-5 lg:order-none lg:col-start-2 lg:row-start-3">
        <NeedsReviewCard now={now} items={homework} />
      </div>

      <div className="order-3 lg:order-none lg:col-start-2 lg:row-start-4">
        <PrepQueueCard lesson={prepLesson} />
      </div>
    </div>
  );
}
