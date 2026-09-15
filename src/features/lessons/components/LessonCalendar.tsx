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
import { moveLessonAction } from "../actions";
import { layoutDayIntervals } from "../calendar-layout";
import {
  formatHourLabel,
  formatMinutesOfDay,
  formatWeekdayShort,
  isSameDay,
  minutesSinceMidnight,
  startOfDay,
  toDateParam,
} from "../date-utils";
import type { LessonStatus } from "../schemas";

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

const STATUS_BLOCK_CLASSES: Record<LessonStatus, string> = {
  scheduled: "bg-cyan hover:bg-cyan-strong text-on-cyan",
  completed: "bg-brand hover:bg-brand-strong text-on-brand",
  cancelled: "bg-surface-muted hover:bg-border text-ink-muted line-through",
  no_show: "bg-warning hover:bg-warning-strong text-on-warning",
};

function snap(minutes: number) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

type DragState = {
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originDayIndex: number;
  originStartMinutes: number;
  durationMinutes: number;
  moved: boolean;
};

export function LessonCalendar({
  dayStartValues,
  lessons: initialLessons,
  students,
  highlightLessonId,
  homeworkDueCountByDate,
  homeworkReviewCountByDate,
  onSlotClick,
}: {
  dayStartValues: string[];
  lessons: CalendarLesson[];
  students: { id: string; name: string }[];
  highlightLessonId?: string | null;
  homeworkDueCountByDate?: Record<string, number>;
  homeworkReviewCountByDate?: Record<string, number>;
  onSlotClick: (dayIndex: number, startMinutes: number, endMinutes: number) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const days = useMemo(() => dayStartValues.map((value) => new Date(value)), [dayStartValues]);
  const now = useMemo(() => new Date(), []);

  const [lessons, setLessons] = useState(initialLessons);
  useEffect(() => setLessons(initialLessons), [initialLessons]);

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
    let earliestHour = DEFAULT_START_HOUR;
    let latestHour = DEFAULT_END_HOUR;
    for (const lesson of lessons) {
      const start = minutesSinceMidnight(new Date(lesson.startTime)) / 60;
      const end = minutesSinceMidnight(new Date(lesson.endTime)) / 60;
      earliestHour = Math.min(earliestHour, Math.floor(start));
      latestHour = Math.max(latestHour, Math.ceil(end));
    }
    return { startHour: earliestHour, endHour: latestHour };
  }, [lessons]);
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
    const currentHour = now.getHours() + now.getMinutes() / 60;
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
    dragRef.current = {
      id: lesson.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originDayIndex: dayIndex,
      originStartMinutes: minutesSinceMidnight(start),
      durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000),
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleBlockPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;

    const dayIndex = dayIndexFromClientX(event.clientX);
    const startMinutes = clampMinutes(snap(drag.originStartMinutes + (dy / PX_PER_HOUR) * 60));
    setDragPreview({ id: drag.id, dayIndex, startMinutes });
  }

  function handleBlockPointerUp(
    event: ReactPointerEvent<HTMLButtonElement>,
    lesson: CalendarLesson,
  ) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || event.pointerId !== drag.pointerId) return;

    if (!drag.moved) {
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
    const newStart = new Date(day);
    newStart.setMinutes(finalStartMinutes);
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
      const result = await moveLessonAction(
        lesson.id,
        newStart.toISOString(),
        newEnd.toISOString(),
      );
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
        <div className="border-b border-danger/25 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div
        className="flex border-b border-border bg-surface-muted"
        style={{ paddingLeft: GUTTER_PX }}
      >
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          const isPast = startOfDay(day) < startOfDay(now);
          const dateParam = toDateParam(day);
          const dueCount = homeworkDueCountByDate?.[dateParam] ?? 0;
          const reviewCount = homeworkReviewCountByDate?.[dateParam] ?? 0;
          return (
            <div
              key={day.toISOString()}
              className={`flex-1 border-l border-border px-2 py-2.5 text-center first:border-l-0 ${
                isToday ? "bg-brand/10" : isPast ? "bg-surface-muted/50" : ""
              }`}
            >
              <p
                className={`text-xs font-medium uppercase tracking-wide ${isPast ? "text-ink-subtle/70" : "text-ink-subtle"}`}
              >
                {formatWeekdayShort(day)}
                {isPast && !isToday ? " · Past" : ""}
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
                      className="rounded-full bg-warning/20 px-1.5 text-[10px] font-medium leading-tight text-warning"
                    >
                      {dueCount}
                    </span>
                  )}
                  {reviewCount > 0 && (
                    <span
                      title={`${reviewCount} ready for review`}
                      className="rounded-full bg-cyan/20 px-1.5 text-[10px] font-medium leading-tight text-cyan"
                    >
                      {reviewCount}
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
              <span className="absolute -top-2 right-2 text-[11px] text-ink-subtle">
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
            const isToday = isSameDay(day, now);
            const isPastDay = startOfDay(day) < startOfDay(now);
            const nowLineTop = ((minutesSinceMidnight(now) - START_HOUR * 60) / 60) * PX_PER_HOUR;
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
                startMinutes: minutesSinceMidnight(new Date(lesson.startTime)),
                endMinutes: minutesSinceMidnight(new Date(lesson.endTime)),
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

                {isToday && now.getHours() >= START_HOUR && now.getHours() < END_HOUR && (
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
                    : clampMinutes(minutesSinceMidnight(start));
                  const top = ((startMinutes - START_HOUR * 60) / 60) * PX_PER_HOUR;
                  const height = Math.max((durationMinutes / 60) * PX_PER_HOUR, 22);
                  const compact = height < 40;
                  const isHighlighted = highlightLessonId === lesson.id;
                  const layout = dayLayout.get(lesson.id);
                  const columns = isDragging ? 1 : (layout?.columns ?? 1);
                  const column = isDragging ? 0 : (layout?.column ?? 0);
                  const widthPct = 100 / columns;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onPointerDown={(event) => handleBlockPointerDown(event, lesson, dayIndex)}
                      onPointerMove={handleBlockPointerMove}
                      onPointerUp={(event) => handleBlockPointerUp(event, lesson)}
                      className={`absolute z-20 overflow-hidden rounded-md px-2 text-left text-xs shadow-sm transition-colors ${STATUS_BLOCK_CLASSES[lesson.status]} ${isDragging ? "cursor-grabbing opacity-90 shadow-lg" : "cursor-grab"} ${isHighlighted ? "ring-2 ring-danger ring-offset-1" : ""}`}
                      style={{
                        top,
                        height,
                        left: `calc(${column * widthPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                    >
                      <span className="block truncate font-medium leading-tight">
                        {formatMinutesOfDay(startMinutes)} · {lesson.studentName}
                      </span>
                      {!compact && (
                        <span className="block truncate text-[11px] opacity-90">
                          {durationMinutes} min
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
