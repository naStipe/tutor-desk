"use client";

import { animate } from "motion";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import {
  formatDuration,
  formatEyebrowDate,
  formatOverdue,
  formatRelativePast,
  greetingWord,
  WEEKLY_GOAL_HOURS,
} from "../format";
import { prefersReducedMotion } from "../../../lib/motion";

export type TodayLesson = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  meetingUrl: string | null;
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

export type UpcomingLesson = {
  id: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  studentId: string;
  studentName: string;
};

export type StudentOverview = {
  id: string;
  name: string;
  sparkline: number[];
  totalHours: number;
  status: "overdue" | "plan-missing" | "no-lesson" | "caught-up";
};

export type SubjectSplitItem = { name: string; hours: number; percent: number };

export type DashboardAnalytics = {
  hoursTrend: number[];
  weekLabels: string[];
  monthHours: number;
  monthVsPrevPct: number | null;
  subjectSplit: SubjectSplitItem[];
  heatmap: number[][];
  studentsOverview: StudentOverview[];
  upcomingAfterToday: UpcomingLesson[];
};

export type TodayDashboardProps = {
  firstName: string;
  locale: string;
  lessons: TodayLesson[];
  homework: HomeworkAttentionItem[];
  unbilled: { count: number; oldestDate: string | null };
  weekLoad: { lessonCount: number; totalMinutes: number; perDayMinutes: number[] };
  analytics: DashboardAnalytics;
};

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Card({
  className = "",
  children,
  index = 0,
}: {
  className?: string;
  children: React.ReactNode;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: entrance plays once on mount; index only sets its stagger delay
  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;
    animate(
      ref.current,
      { opacity: [0, 1], y: [10, 0] },
      { type: "spring", bounce: 0, duration: 0.45, delay: index * 0.06 },
    );
  }, []);

  return (
    <div
      ref={ref}
      onPointerEnter={() => {
        if (prefersReducedMotion() || !ref.current) return;
        animate(
          ref.current,
          { y: -3, boxShadow: "0 10px 24px rgba(0,0,0,0.07)" },
          { type: "spring", bounce: 0.15, duration: 0.35 },
        );
      }}
      onPointerLeave={() => {
        if (prefersReducedMotion() || !ref.current) return;
        animate(
          ref.current,
          { y: 0, boxShadow: "0 0px 0px rgba(0,0,0,0)" },
          { type: "spring", bounce: 0.2, duration: 0.4 },
        );
      }}
      className={`rounded-[16px] border border-[var(--td2-border-card)] bg-[var(--td2-bg-card)] p-[22px_24px] ${className}`}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--td2-text-muted)]">
      {children}
    </p>
  );
}

function GreetingHeader({
  now,
  firstName,
  locale,
}: {
  now: Date;
  firstName: string;
  locale: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p
          suppressHydrationWarning
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--td2-text-muted)]"
        >
          {formatEyebrowDate(now, locale)}
        </p>
        <h1
          suppressHydrationWarning
          className="mt-2 text-[30px] font-bold leading-none tracking-[-0.035em] text-[var(--td2-text-primary)] lg:text-[38px]"
        >
          {greetingWord(now)}, {firstName}.
        </h1>
      </div>
      <Link
        href="/dashboard/schedule?create=1"
        className="inline-flex items-center rounded-[11px] bg-[var(--td2-primary-bg)] px-[18px] py-[11px] text-[14px] font-medium text-[var(--td2-primary-fg)] transition-[transform,filter] duration-150 hover:-translate-y-0.5 hover:brightness-110 active:scale-95 active:duration-75 active:brightness-95 motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
      >
        + New lesson
      </Link>
    </div>
  );
}

function buildLinePath(values: number[], width: number, height: number, topPad = 10, botPad = 12) {
  const max = Math.max(1, ...values);
  const innerHeight = height - topPad - botPad;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((value, index) => ({
    x: index * step,
    y: topPad + innerHeight - (value / max) * innerHeight,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  const areaPath = `${linePath} L${(last?.x ?? 0).toFixed(1)} ${height} L0 ${height} Z`;
  return { linePath, areaPath, points, last };
}

const HoursTrendCard = memo(function HoursTrendCard({
  analytics,
}: {
  analytics: DashboardAnalytics;
}) {
  const width = 520;
  const height = 150;
  const { linePath, areaPath, last } = buildLinePath(analytics.hoursTrend, width, height);
  const weekHours = analytics.hoursTrend.at(-1) ?? 0;
  const goalPct = Math.min(100, Math.round((weekHours / WEEKLY_GOAL_HOURS) * 100));

  return (
    <Card index={0}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>Teaching hours · last 8 weeks</Eyebrow>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span className="text-[30px] font-bold tracking-[-0.03em] text-[var(--td2-text-primary)]">
              {analytics.monthHours < 10 ? analytics.monthHours.toFixed(1) : Math.round(analytics.monthHours)}h
            </span>
            {analytics.monthVsPrevPct !== null && (
              <span className="text-[12px] font-medium text-[var(--td2-accent-text-strong)]">
                {analytics.monthVsPrevPct >= 0 ? "+" : ""}
                {analytics.monthVsPrevPct}% vs last month
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <Eyebrow>This week vs {WEEKLY_GOAL_HOURS}h goal</Eyebrow>
          <p className="mt-2.5 text-[13px] font-medium text-[var(--td2-text-secondary)]">
            {weekHours.toFixed(1)}h · {goalPct}%
          </p>
        </div>
      </div>

      <div className="mt-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="block h-[130px] w-full"
          role="img"
          aria-label="Teaching hours per week, last 8 weeks"
        >
          <defs>
            <linearGradient id="hoursTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--td2-accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--td2-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1={height * 0.23} x2={width} y2={height * 0.23} stroke="currentColor" strokeOpacity="0.08" />
          <line x1="0" y1={height * 0.48} x2={width} y2={height * 0.48} stroke="currentColor" strokeOpacity="0.08" />
          <line x1="0" y1={height * 0.73} x2={width} y2={height * 0.73} stroke="currentColor" strokeOpacity="0.08" />
          <path d={areaPath} fill="url(#hoursTrendFill)" />
          <path d={linePath} fill="none" stroke="var(--td2-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {last && (
            <>
              <circle cx={last.x} cy={last.y} r="4.5" fill="var(--td2-accent)" />
              <circle cx={last.x} cy={last.y} r="8" fill="var(--td2-accent)" fillOpacity="0.2" />
            </>
          )}
        </svg>
        <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--td2-text-faint)]">
          {analytics.weekLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </Card>
  );
});

const DONUT_CIRCUMFERENCE = 2 * Math.PI * 42;
const DONUT_OPACITIES = [1, 0.6, 0.32, 0.16];

const SubjectSplitCard = memo(function SubjectSplitCard({
  analytics,
}: {
  analytics: DashboardAnalytics;
}) {
  const items = analytics.subjectSplit.slice(0, 4);
  let cumulative = 0;

  return (
    <Card className="flex flex-col" index={1}>
      <Eyebrow>Subject split · this month</Eyebrow>
      {items.length === 0 ? (
        <p className="mt-6 flex-1 text-sm text-[var(--td2-text-muted)]">No lessons logged this month yet.</p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-5">
            <div className="relative h-[104px] w-[104px] shrink-0">
              <svg
                viewBox="0 0 100 100"
                className="block h-[104px] w-[104px] -rotate-90"
                role="img"
                aria-label="Subject split for this month"
              >
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="12" />
                {items.map((item, index) => {
                  const dash = (item.percent / 100) * DONUT_CIRCUMFERENCE;
                  const offset = -((cumulative / 100) * DONUT_CIRCUMFERENCE);
                  cumulative += item.percent;
                  return (
                    <circle
                      key={item.name}
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--td2-accent)"
                      strokeOpacity={DONUT_OPACITIES[index] ?? 0.16}
                      strokeWidth="12"
                      strokeDasharray={`${dash} ${DONUT_CIRCUMFERENCE - dash}`}
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[19px] font-bold tracking-[-0.02em] text-[var(--td2-text-primary)]">
                  {Math.round(analytics.monthHours)}h
                </span>
                <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-[var(--td2-text-faint)]">
                  Total
                </span>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              {items.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{ background: "var(--td2-accent)", opacity: DONUT_OPACITIES[index] ?? 0.16 }}
                  />
                  <span className="flex-1 truncate text-[12.5px] font-medium text-[var(--td2-text-primary)]">
                    {item.name}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--td2-text-muted)]">
                    {item.hours.toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex-1" />
          <div className="mt-4 border-t border-[var(--td2-border-hairline)] pt-3.5 text-[12px] text-[var(--td2-text-muted)]">
            {items[0].name} is {items[0].percent}% of this month.
          </div>
        </>
      )}
    </Card>
  );
});

function SchedulePill({ label }: { label: "DONE" | "UP NEXT" | "IN PROGRESS" | "NO PLAN" | "READY" }) {
  const base = "shrink-0 rounded-[7px] px-[9px] py-[4px] font-mono text-[9px] tracking-[0.08em]";
  if (label === "UP NEXT" || label === "IN PROGRESS")
    return <span className={`${base} font-medium bg-[var(--td2-primary-bg)] text-[var(--td2-primary-fg)]`}>{label}</span>;
  if (label === "NO PLAN")
    return (
      <span className={`${base} bg-[var(--td2-accent-surface)] text-[var(--td2-accent-text)]`}>NO PLAN</span>
    );
  if (label === "DONE")
    return <span className={`${base} bg-[var(--td2-bg-inset)] text-[var(--td2-text-faint)]`}>DONE</span>;
  return <span className={`${base} bg-[var(--td2-bg-inset)] text-[var(--td2-text-muted)]`}>READY</span>;
}

function ScheduleAheadCard({
  now,
  lessons,
  upcoming,
  locale,
}: {
  now: Date;
  lessons: TodayLesson[];
  upcoming: UpcomingLesson[];
  locale: string;
}) {
  const remainingToday = lessons.filter(
    (lesson) => lesson.status !== "cancelled" && new Date(lesson.endTime) > now,
  );
  const items = [
    ...remainingToday.map((lesson) => ({
      id: lesson.id,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      notes: lesson.notes,
      status: lesson.status,
      studentName: lesson.studentName,
    })),
    ...upcoming.map((lesson) => ({
      id: lesson.id,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      notes: lesson.notes,
      status: "scheduled",
      studentName: lesson.studentName,
    })),
  ].slice(0, 5);

  const totalMinutes = items.reduce(
    (sum, item) => sum + (new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 60000,
    0,
  );

  return (
    <Card className="flex flex-col" index={0}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[var(--td2-text-primary)]">
          Next few days
        </h2>
        <span className="font-mono text-[11px] text-[var(--td2-text-muted)]">
          {items.length} · {formatDuration(totalMinutes)}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-6 flex-1 text-sm text-[var(--td2-text-muted)]">Nothing scheduled yet.</p>
      ) : (
        <div className="mt-3.5">
          {items.map((item, index) => {
            const start = new Date(item.startTime);
            const inProgress = index === 0 && now >= start && now < new Date(item.endTime);
            const done = item.status === "completed" || item.status === "no_show";
            const hasPlan = item.notes && item.notes.trim() !== "";
            let pill: "DONE" | "UP NEXT" | "IN PROGRESS" | "NO PLAN" | "READY" = hasPlan ? "READY" : "NO PLAN";
            if (done) pill = "DONE";
            else if (index === 0) pill = inProgress ? "IN PROGRESS" : "UP NEXT";

            return (
              <Link
                key={item.id}
                href={`/dashboard/lessons/${item.id}`}
                className="flex items-center gap-3 border-t border-[var(--td2-border-hairline)] py-3 first:border-t-0 transition-[background-color,transform] duration-100 hover:bg-[var(--td2-bg-row-hover)] active:scale-[0.99] active:bg-[var(--td2-bg-row-hover)] motion-reduce:active:scale-100"
              >
                <span className="w-[52px] shrink-0 font-mono text-[10.5px] text-[var(--td2-text-secondary)]">
                  {start.toLocaleDateString(locale, { weekday: "short" }).toUpperCase()}{" "}
                  {start.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[var(--td2-text-primary)]">
                    {item.studentName}
                  </span>
                </span>
                <SchedulePill label={pill} />
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function MiniTrendLine({ values }: { values: number[] }) {
  const width = 64;
  const height = 20;
  const { linePath } = buildLinePath(values, width, height, 2, 2);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-5 w-16 shrink-0"
      role="img"
      aria-label="Hours per week trend"
    >
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_LABEL: Record<StudentOverview["status"], string> = {
  overdue: "Homework overdue",
  "plan-missing": "Plan missing",
  "no-lesson": "No next lesson",
  "caught-up": "All caught up",
};

const StudentsOverviewCard = memo(function StudentsOverviewCard({
  students,
}: {
  students: StudentOverview[];
}) {
  const shown = students.slice(0, 5);
  return (
    <Card className="flex flex-col" index={1}>
      <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[var(--td2-text-primary)]">Students</h2>
      {shown.length === 0 ? (
        <p className="mt-6 flex-1 text-sm text-[var(--td2-text-muted)]">No active students yet.</p>
      ) : (
        <div className="mt-3.5">
          {shown.map((student) => {
            const needsAttention = student.status === "overdue" || student.status === "plan-missing";
            return (
              <Link
                key={student.id}
                href={`/dashboard/students/${student.id}`}
                className="flex items-center gap-2.5 border-t border-[var(--td2-border-hairline)] py-2.5 first:border-t-0 transition-[background-color,transform] duration-100 hover:bg-[var(--td2-bg-row-hover)] active:scale-[0.99] active:bg-[var(--td2-bg-row-hover)] motion-reduce:active:scale-100"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-[var(--td2-text-primary)]">
                    {student.name}
                  </span>
                  <span
                    className={`block text-[11px] ${
                      needsAttention ? "text-[var(--td2-accent-text)]" : "text-[var(--td2-text-muted)]"
                    }`}
                  >
                    {STATUS_LABEL[student.status]}
                  </span>
                </span>
                <span
                  className={needsAttention ? "text-[var(--td2-accent)]" : "text-[var(--td2-text-faint)]"}
                >
                  <MiniTrendLine values={student.sparkline} />
                </span>
                <span className="w-6 shrink-0 text-right font-mono text-[11px] text-[var(--td2-text-muted)]">
                  {student.totalHours.toFixed(0)}h
                </span>
              </Link>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex-1" />
      <p className="mt-4 border-t border-[var(--td2-border-hairline)] pt-3.5 text-[11.5px] text-[var(--td2-text-muted)]">
        Trend = hours per week, last 7 weeks.
      </p>
    </Card>
  );
});

function heatCellStyle(hours: number, max: number) {
  if (max <= 0 || hours <= 0) return { background: "var(--td2-bg-inset)" };
  const ratio = hours / max;
  const opacity = ratio > 0.66 ? 1 : ratio > 0.33 ? 0.55 : 0.28;
  return { background: "var(--td2-accent)", opacity };
}

const TermHeatmapCard = memo(function TermHeatmapCard({
  analytics,
}: {
  analytics: DashboardAnalytics;
}) {
  const max = Math.max(1, ...analytics.heatmap.flat());
  const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <Card className="flex flex-col" index={2}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[var(--td2-text-primary)]">
          Term heatmap
        </h2>
      </div>
      <div className="mt-4 flex gap-1.5">
        <div className="flex flex-col gap-1.5 pt-[18px] font-mono text-[8.5px] text-[var(--td2-text-faint)]">
          {weekdayLabels.map((label, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-day week order, no identity to key on
            <div key={index} className="flex h-[15px] items-center">
              {label}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex gap-1.5 font-mono text-[8.5px] text-[var(--td2-text-faint)]">
            {analytics.heatmap.map((_, weekIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed week-number order, no identity to key on
              <div key={weekIndex} className="flex-1 text-center">
                W{weekIndex + 1}
              </div>
            ))}
          </div>
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${analytics.heatmap.length}, 1fr)` }}
          >
            {Array.from({ length: 7 }, (_, dayIndex) =>
              analytics.heatmap.map((week, weekIndex) => ({
                key: `${weekIndex}-${dayIndex}`,
                hours: week[dayIndex] ?? 0,
              })),
            )
              .flat()
              .map((cell) => (
                <div
                  key={cell.key}
                  className="h-[15px] rounded-[3px]"
                  style={heatCellStyle(cell.hours, max)}
                />
              ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex-1" />
      <div className="mt-4 flex items-center gap-2 border-t border-[var(--td2-border-hairline)] pt-3.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--td2-text-faint)]">
          Less
        </span>
        <div className="h-[11px] w-[11px] rounded-[3px]" style={{ background: "var(--td2-bg-inset)" }} />
        <div className="h-[11px] w-[11px] rounded-[3px]" style={{ background: "var(--td2-accent)", opacity: 0.28 }} />
        <div className="h-[11px] w-[11px] rounded-[3px]" style={{ background: "var(--td2-accent)", opacity: 0.55 }} />
        <div className="h-[11px] w-[11px] rounded-[3px]" style={{ background: "var(--td2-accent)" }} />
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--td2-text-faint)]">
          More
        </span>
      </div>
    </Card>
  );
});

function NeedsReviewStrip({ now, items }: { now: Date; items: HomeworkAttentionItem[] }) {
  if (items.length === 0) return null;
  return (
    <Card className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <h2 className="text-[15px] font-bold tracking-[-0.02em] text-[var(--td2-text-primary)]">
          Needs review
        </h2>
        <span className="rounded-[20px] bg-[var(--td2-attention)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--td2-attention-ink)]">
          {items.length}
        </span>
      </div>
      <div>
        {items.map(({ id, title, studentName, overdue, submittedAt, dueDate }) => (
          <Link
            key={id}
            href={`/dashboard/homework/${id}`}
            className="flex items-center justify-between gap-3 border-t border-[var(--td2-border-hairline)] py-3 first:border-t-0 transition-[background-color,transform] duration-100 hover:bg-[var(--td2-bg-row-hover)] active:scale-[0.99] active:bg-[var(--td2-bg-row-hover)] motion-reduce:active:scale-100"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--td2-text-primary)]">{title}</p>
              <p
                suppressHydrationWarning
                className={`mt-1 font-mono text-[11px] ${overdue ? "text-[var(--td2-accent-text)]" : "text-[var(--td2-text-muted)]"}`}
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
    </Card>
  );
}

export function TodayDashboard({
  firstName,
  locale,
  lessons,
  homework,
  unbilled,
  analytics,
}: TodayDashboardProps) {
  const now = useNow(30000);

  return (
    <div className="flex flex-col gap-[18px] p-5 sm:px-[34px] sm:py-[30px] lg:gap-[22px]">
      <GreetingHeader now={now} firstName={firstName} locale={locale} />

      {unbilled.count > 0 && (
        <Link
          href="/dashboard/lessons"
          className="inline-flex w-fit items-center gap-2 rounded-[10px] border border-[var(--td2-border-card)] bg-[var(--td2-bg-card)] px-3.5 py-2 text-[12.5px] text-[var(--td2-text-secondary)] transition-transform duration-100 hover:bg-[var(--td2-bg-row-hover)] active:scale-[0.97] motion-reduce:active:scale-100"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--td2-accent-dot)]" />
          {unbilled.count} unbilled lesson{unbilled.count === 1 ? "" : "s"}
        </Link>
      )}

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.6fr_1fr] lg:gap-[22px]">
        <HoursTrendCard analytics={analytics} />
        <SubjectSplitCard analytics={analytics} />
      </div>

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3 lg:gap-[22px]">
        <ScheduleAheadCard
          now={now}
          lessons={lessons}
          upcoming={analytics.upcomingAfterToday}
          locale={locale}
        />
        <StudentsOverviewCard students={analytics.studentsOverview} />
        <TermHeatmapCard analytics={analytics} />
      </div>

      <NeedsReviewStrip now={now} items={homework} />
    </div>
  );
}
