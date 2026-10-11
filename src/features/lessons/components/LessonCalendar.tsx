"use client";

import { useRouter } from "next/navigation";
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { assignStudentHues, type StudentHue } from "../../../lib/color";
import { moveLessonAction } from "../actions";
import { layoutDayIntervals } from "../calendar-layout";
import {
  dayRelativeToToday,
  formatHourLabel,
  formatMinutesOfDay,
  formatWeekdayShort,
  isSameDay,
  minutesSinceMidnightInZone,
  toDateParam,
  zonedMinutesToDate,
} from "../date-utils";
import type { LessonStatus } from "../schemas";
import { type DisplayStatus, displayStatus } from "../status";

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 21;
const PX_PER_HOUR = 44;
const SNAP_MINUTES = 15;
const GUTTER_PX = 52;
const GRID_MAX_HEIGHT_PX = 560;

export type CalendarLesson = {
  id: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime: string;
  status: LessonStatus;
};

// Lesson blocks are colored by student (a consistent hue per student, so a busy week is scannable
// at a glance) with lesson status layered on top as a secondary cue — a left accent stripe, a small
// status dot, and (for cancelled) a strikethrough — rather than status displacing the student color
// the way a single status-only fill used to. Hues come from an 8-color palette (`src/lib/color.ts`),
// derived from student ids (no stored color), so a student keeps one color across the calendar.
const STUDENT_BLOCK_FILL_CLASSES: Record<StudentHue, string> = {
  brand: "bg-brand/20 hover:bg-brand/30 text-ink",
  cyan: "bg-cyan/20 hover:bg-cyan/30 text-ink",
  violet: "bg-violet/20 hover:bg-violet/30 text-ink",
  warning: "bg-warning/20 hover:bg-warning/30 text-ink",
  blue: "bg-hue-blue/20 hover:bg-hue-blue/30 text-ink",
  pink: "bg-hue-pink/20 hover:bg-hue-pink/30 text-ink",
  orange: "bg-hue-orange/20 hover:bg-hue-orange/30 text-ink",
  lime: "bg-hue-lime/20 hover:bg-hue-lime/30 text-ink",
};

const STATUS_ACCENT_CLASSES: Record<DisplayStatus, string> = {
  scheduled: "border-l-cyan",
  in_progress: "border-l-violet",
  completed: "border-l-brand",
  cancelled: "border-l-ink-subtle",
  no_show: "border-l-warning",
};

/** Non-color status cue: a glyph that differs per status (the dot color alone is not enough). */
export const STATUS_GLYPHS: Record<DisplayStatus, string> = {
  scheduled: "○",
  in_progress: "◐",
  completed: "✓",
  cancelled: "⊘",
  no_show: "!",
};

export const STATUS_TEXT_CLASSES: Record<DisplayStatus, string> = {
  scheduled: "text-cyan",
  in_progress: "text-violet",
  completed: "text-brand",
  cancelled: "text-ink-muted",
  no_show: "text-warning",
};

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

function snap(minutes: number) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

const TOUCH_CANCEL_PX = 8;

type DragState = {
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originDayIndex: number;
  originStartMinutes: number;
  durationMinutes: number;
  moved: boolean;
  /** Mouse/pen drag immediately. Touch is never armed: a touch is a tap (open) or a scroll. */
  armed: boolean;
};

export function LessonCalendar({
  dayStartValues,
  lessons: initialLessons,
  students,
  highlightLessonId,
  homeworkDueCountByDate,
  homeworkReviewCountByDate,
  timeZone,
  locale,
  workingHoursStartMinutes,
  workingHoursEndMinutes,
  onSlotClick,
}: {
  dayStartValues: string[];
  lessons: CalendarLesson[];
  students: { id: string; name: string }[];
  highlightLessonId?: string | null;
  homeworkDueCountByDate?: Record<string, number>;
  homeworkReviewCountByDate?: Record<string, number>;
  timeZone?: string;
  locale?: string;
  workingHoursStartMinutes?: number;
  workingHoursEndMinutes?: number;
  onSlotClick: (dayIndex: number, startMinutes: number, endMinutes: number) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const days = useMemo(() => dayStartValues.map((value) => new Date(value)), [dayStartValues]);
  // Refresh once a minute so the "now" line and today/past-day highlighting stay accurate in a
  // long-open session instead of freezing at whenever the calendar first mounted.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // "Now" as the tutor's timezone sees it (not the browser's): today's date and the minutes since
  // midnight, used for the today/past highlighting and the now-line.
  const nowMinutes = minutesSinceMidnightInZone(now, timeZone);

  const [lessons, setLessons] = useState(initialLessons);
  useEffect(() => setLessons(initialLessons), [initialLessons]);

  // Distinct colors across every student the calendar can show, computed from ids only.
  const studentHues = useMemo(
    () => assignStudentHues([...students.map((s) => s.id), ...lessons.map((l) => l.studentId)]),
    [students, lessons],
  );

  const [error, setError] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    id: string;
    dayIndex: number;
    startMinutes: number;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  // The grid always covers the default window, but expands to fit any lesson that falls
  // outside it instead of clipping/hiding it.
  const { startHour: START_HOUR, endHour: END_HOUR } = useMemo(() => {
    const defaultStartHour =
      workingHoursStartMinutes !== undefined
        ? Math.floor(workingHoursStartMinutes / 60)
        : DEFAULT_START_HOUR;
    const defaultEndHour =
      workingHoursEndMinutes !== undefined
        ? Math.ceil(workingHoursEndMinutes / 60)
        : DEFAULT_END_HOUR;
    let earliestHour = defaultStartHour;
    let latestHour = defaultEndHour;
    for (const lesson of lessons) {
      const start = minutesSinceMidnightInZone(new Date(lesson.startTime), timeZone) / 60;
      const end = minutesSinceMidnightInZone(new Date(lesson.endTime), timeZone) / 60;
      earliestHour = Math.min(earliestHour, Math.floor(start));
      latestHour = Math.max(latestHour, Math.ceil(end));
    }
    return { startHour: earliestHour, endHour: latestHour };
  }, [lessons, timeZone, workingHoursStartMinutes, workingHoursEndMinutes]);
  const GRID_HEIGHT = (END_HOUR - START_HOUR) * PX_PER_HOUR;
  const HOURS = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i),
    [START_HOUR, END_HOUR],
  );

  function clampMinutes(minutes: number) {
    return Math.min(Math.max(minutes, START_HOUR * 60), END_HOUR * 60);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to "now" only on initial mount
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const currentHour = nowMinutes / 60;
    const targetHour =
      currentHour >= START_HOUR && currentHour < END_HOUR ? currentHour : START_HOUR;
    container.scrollTop = Math.max(0, (targetHour - START_HOUR - 1) * PX_PER_HOUR);
  }, []);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  function dayIndexFromClientX(clientX: number) {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const columnWidth = (rect.width - GUTTER_PX) / days.length;
    const index = Math.floor((clientX - rect.left - GUTTER_PX) / columnWidth);
    return Math.min(Math.max(index, 0), days.length - 1);
  }

  function minutesFromClientY(clientY: number) {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return START_HOUR * 60;
    const minutes = ((clientY - rect.top) / PX_PER_HOUR) * 60 + START_HOUR * 60;
    return clampMinutes(snap(minutes));
  }

  function handleBlockPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    lesson: CalendarLesson,
    dayIndex: number,
  ) {
    event.stopPropagation();
    const start = new Date(lesson.startTime);
    const end = new Date(lesson.endTime);
    const isTouch = event.pointerType === "touch";
    const target = event.currentTarget;
    const pointerId = event.pointerId;
    const state: DragState = {
      id: lesson.id,
      pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originDayIndex: dayIndex,
      originStartMinutes: minutesSinceMidnightInZone(start, timeZone),
      durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000),
      moved: false,
      armed: !isTouch,
    };
    dragRef.current = state;

    // `touch-pan-y` hands vertical movement to the browser's scroll, which fires pointercancel
    // mid-gesture. A long-press "drag" could therefore only ever move a lesson sideways, never
    // change its time, so touch doesn't drag: a tap opens the lesson, where Edit changes its time.
    if (!isTouch) target.setPointerCapture(pointerId);
  }

  function handleBlockPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    if (!drag.armed) {
      const dx0 = event.clientX - drag.startClientX;
      const dy0 = event.clientY - drag.startClientY;
      if (Math.hypot(dx0, dy0) > TOUCH_CANCEL_PX) {
        // Finger moved: this is a scroll, not a tap. Let it through.
        dragRef.current = null;
      }
      return;
    }

    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;

    const dayIndex = dayIndexFromClientX(event.clientX);
    const startMinutes = clampMinutes(snap(drag.originStartMinutes + (dy / PX_PER_HOUR) * 60));
    setDragPreview({ id: drag.id, dayIndex, startMinutes });
  }

  function handleBlockPointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    setDragPreview(null);
  }

  function handleBlockPointerUp(
    event: ReactPointerEvent<HTMLButtonElement>,
    lesson: CalendarLesson,
  ) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || event.pointerId !== drag.pointerId) return;

    if (!drag.armed || !drag.moved) {
      setDragPreview(null);
      router.push(`/dashboard/lessons/${lesson.id}`);
      return;
    }

    const finalDayIndex = dayIndexFromClientX(event.clientX);
    const finalStartMinutes = clampMinutes(
      snap(drag.originStartMinutes + ((event.clientY - drag.startClientY) / PX_PER_HOUR) * 60),
    );
    setDragPreview(null);

    if (finalDayIndex === drag.originDayIndex && finalStartMinutes === drag.originStartMinutes) {
      return;
    }

    const day = days[finalDayIndex];
    const newStart = zonedMinutesToDate(toDateParam(day), finalStartMinutes, timeZone);
    const newEnd = new Date(newStart.getTime() + drag.durationMinutes * 60000);

    const previousLessons = lessons;
    setLessons((prev) =>
      prev.map((item) =>
        item.id === lesson.id
          ? { ...item, startTime: newStart.toISOString(), endTime: newEnd.toISOString() }
          : item,
      ),
    );

    startTransition(async () => {
      let result: Awaited<ReturnType<typeof moveLessonAction>>;
      try {
        result = await moveLessonAction(lesson.id, newStart.toISOString(), newEnd.toISOString());
      } catch {
        // Thrown (network, expired session): put the block back instead of leaving it moved.
        setLessons(previousLessons);
        setError("Couldn't move the lesson. Try again.");
        return;
      }
      if ("error" in result) {
        setLessons(previousLessons);
        setError(result.error ?? "Unable to move lesson.");
      } else {
        router.refresh();
      }
    });
  }

  function handleColumnClick(event: ReactMouseEvent<HTMLDivElement>, dayIndex: number) {
    if (students.length === 0) {
      setError("Add a student before scheduling a lesson.");
      return;
    }
    const startMinutes = minutesFromClientY(event.clientY);
    const endMinutes = Math.min(startMinutes + 60, END_HOUR * 60);
    onSlotClick(dayIndex, startMinutes, endMinutes);
  }

  const isDayView = days.length === 1;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-surface shadow-sm shadow-black/[0.03] ${
        isDayView ? "max-w-md" : ""
      }`}
    >
      {error && (
        <div
          role="alert"
          className="border-b border-danger/25 bg-danger/10 px-4 py-2 text-sm text-danger"
        >
          {error}
        </div>
      )}

      <div
        className="flex border-b border-border bg-surface-muted"
        style={{ paddingLeft: GUTTER_PX }}
      >
        {days.map((day) => {
          const dateParam = toDateParam(day);
          const relativeToToday = dayRelativeToToday(dateParam, now, timeZone);
          const isToday = relativeToToday === "today";
          const isPast = relativeToToday === "past";
          const dueCount = homeworkDueCountByDate?.[dateParam] ?? 0;
          const reviewCount = homeworkReviewCountByDate?.[dateParam] ?? 0;
          return (
            <div
              key={day.toISOString()}
              className={`flex-1 border-l border-border px-2 py-2.5 text-center first:border-l-0 ${
                isToday
                  ? "border-b-2 border-b-brand bg-brand/10"
                  : isPast
                    ? "bg-surface-muted/50"
                    : ""
              }`}
              aria-current={isToday ? "date" : undefined}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                {formatWeekdayShort(day, timeZone, locale)}
                {isPast && !isToday ? " · Past" : ""}
                {isToday && <span className="sr-only"> (today)</span>}
              </p>
              <p
                className={`mt-0.5 text-sm font-semibold ${
                  isToday ? "text-brand" : isPast ? "text-ink-subtle" : "text-ink"
                }`}
              >
                {day.getDate()}
              </p>
              {(dueCount > 0 || reviewCount > 0) && (
                <p className="mt-1 flex items-center justify-center gap-1">
                  {dueCount > 0 && (
                    <span
                      title={`${dueCount} homework due`}
                      className="rounded-sm bg-warning/20 px-1.5 text-xs font-medium leading-tight text-warning"
                    >
                      {dueCount}
                      <span className="sr-only"> homework due</span>
                    </span>
                  )}
                  {reviewCount > 0 && (
                    <span
                      title={`${reviewCount} ready for review`}
                      className="rounded-full bg-cyan/20 px-1.5 text-xs font-medium leading-tight text-cyan ring-1 ring-inset ring-cyan/50"
                    >
                      {reviewCount}
                      <span className="sr-only"> ready for review</span>
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto overflow-y-auto"
        style={{ maxHeight: GRID_MAX_HEIGHT_PX }}
      >
        <div className="shrink-0 select-none" style={{ width: GUTTER_PX }}>
          {HOURS.map((hour) => (
            <div key={hour} className="relative text-right" style={{ height: PX_PER_HOUR }}>
              <span className="absolute -top-2 right-2 text-xs text-ink-subtle">
                {formatHourLabel(hour)}
              </span>
            </div>
          ))}
        </div>

        <div ref={gridRef} className="relative flex min-w-0 flex-1" style={{ height: GRID_HEIGHT }}>
          {HOURS.map((hour, index) => (
            <div
              key={hour}
              className="pointer-events-none absolute inset-x-0 border-t border-border"
              style={{ top: index * PX_PER_HOUR }}
            />
          ))}

          {days.map((day, dayIndex) => {
            const relativeToToday = dayRelativeToToday(toDateParam(day), now, timeZone);
            const isToday = relativeToToday === "today";
            const isPastDay = relativeToToday === "past";
            const nowLineTop = ((nowMinutes - START_HOUR * 60) / 60) * PX_PER_HOUR;
            const pastOverlayHeight = isPastDay
              ? GRID_HEIGHT
              : isToday
                ? Math.min(Math.max(nowLineTop, 0), GRID_HEIGHT)
                : 0;
            const dayLessons = lessons.filter((lesson) =>
              isSameDay(new Date(lesson.startTime), day),
            );
            const dayLayout = layoutDayIntervals(
              dayLessons.map((lesson) => ({
                id: lesson.id,
                startMinutes: minutesSinceMidnightInZone(new Date(lesson.startTime), timeZone),
                endMinutes: minutesSinceMidnightInZone(new Date(lesson.endTime), timeZone),
              })),
            );

            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: pointer-only calendar creation, keyboard users use the "Schedule lesson" button
              // biome-ignore lint/a11y/noStaticElementInteractions: a day column with a click-to-create affordance, containing focusable lesson buttons
              <div
                key={day.toISOString()}
                className={`relative flex-1 border-l border-border first:border-l-0 ${isToday ? "bg-brand/5" : ""}`}
                onClick={(event) => handleColumnClick(event, dayIndex)}
              >
                {pastOverlayHeight > 0 && (
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-0 bg-surface-muted/50"
                    style={{ height: pastOverlayHeight }}
                  />
                )}

                {isToday && nowMinutes >= START_HOUR * 60 && nowMinutes < END_HOUR * 60 && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-danger"
                    style={{ top: nowLineTop }}
                  >
                    <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-danger" />
                  </div>
                )}

                {dayLessons.map((lesson) => {
                  const isDragging = dragPreview?.id === lesson.id;
                  const effectiveDayIndex = isDragging ? dragPreview.dayIndex : dayIndex;
                  if (effectiveDayIndex !== dayIndex) return null;

                  const start = new Date(lesson.startTime);
                  const end = new Date(lesson.endTime);
                  const durationMinutes = Math.max(
                    15,
                    Math.round((end.getTime() - start.getTime()) / 60000),
                  );
                  const startMinutes = isDragging
                    ? dragPreview.startMinutes
                    : clampMinutes(minutesSinceMidnightInZone(start, timeZone));
                  const top = ((startMinutes - START_HOUR * 60) / 60) * PX_PER_HOUR;
                  const height = Math.max((durationMinutes / 60) * PX_PER_HOUR, 22);
                  const compact = height < 40;
                  const isHighlighted = highlightLessonId === lesson.id;
                  const layout = dayLayout.get(lesson.id);
                  const columns = isDragging ? 1 : (layout?.columns ?? 1);
                  const column = isDragging ? 0 : (layout?.column ?? 0);
                  const widthPct = 100 / columns;
                  const studentHue = studentHues.get(lesson.studentId) ?? "brand";
                  const shown = displayStatus(
                    lesson.status,
                    lesson.startTime,
                    lesson.endTime,
                    now.getTime(),
                  );

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      title={`${lesson.studentName} · ${STATUS_LABELS[shown]}`}
                      aria-label={`${formatMinutesOfDay(startMinutes)} to ${formatMinutesOfDay(startMinutes + durationMinutes)}, ${lesson.studentName}, ${STATUS_LABELS[shown]}`}
                      onPointerDown={(event) => handleBlockPointerDown(event, lesson, dayIndex)}
                      onPointerMove={handleBlockPointerMove}
                      onPointerUp={(event) => handleBlockPointerUp(event, lesson)}
                      onPointerCancel={handleBlockPointerCancel}
                      className={`absolute z-20 touch-pan-y overflow-hidden rounded-md border-l-4 px-2 text-left text-xs shadow-sm transition-colors ${STUDENT_BLOCK_FILL_CLASSES[studentHue]} ${STATUS_ACCENT_CLASSES[shown]} ${shown === "cancelled" ? "opacity-75 line-through" : ""} ${isDragging ? "cursor-grabbing opacity-90 shadow-lg" : "cursor-grab"} ${isHighlighted ? "ring-2 ring-danger ring-offset-1" : ""}`}
                      style={{
                        top,
                        height,
                        left: `calc(${column * widthPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <span
                          aria-hidden="true"
                          className={`shrink-0 text-xs font-bold leading-none ${STATUS_TEXT_CLASSES[shown]}`}
                        >
                          {STATUS_GLYPHS[shown]}
                        </span>
                        <span className="truncate font-medium leading-tight">
                          {formatMinutesOfDay(startMinutes)} · {lesson.studentName}
                        </span>
                      </span>
                      {!compact && (
                        <span className="block truncate text-xs opacity-90">
                          {durationMinutes} min · {STATUS_LABELS[shown]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
