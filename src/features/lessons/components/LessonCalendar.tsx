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
import { Button } from "../../../components/Button";
import { inputClassName } from "../../../components/Field";
import { moveLessonAction, quickCreateLessonAction } from "../actions";
import {
  formatHourLabel,
  formatMinutesOfDay,
  formatWeekdayShort,
  isSameDay,
  minutesSinceMidnight,
  minutesToTimeInputValue,
  timeInputValueToMinutes,
} from "../date-utils";
import type { LessonStatus } from "../schemas";

const START_HOUR = 7;
const END_HOUR = 21;
const PX_PER_HOUR = 56;
const SNAP_MINUTES = 15;
const GUTTER_PX = 52;
const GRID_HEIGHT = (END_HOUR - START_HOUR) * PX_PER_HOUR;

export type CalendarLesson = {
  id: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime: string;
  status: LessonStatus;
};

const STATUS_BLOCK_CLASSES: Record<LessonStatus, string> = {
  scheduled: "bg-blue-600 hover:bg-blue-700 text-white",
  completed: "bg-emerald-600 hover:bg-emerald-700 text-white",
  cancelled: "bg-slate-300 hover:bg-slate-400 text-slate-600 line-through",
  no_show: "bg-amber-500 hover:bg-amber-600 text-white",
};

function clampMinutes(minutes: number) {
  return Math.min(Math.max(minutes, START_HOUR * 60), END_HOUR * 60);
}

function snap(minutes: number) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

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

type PopoverState = { dayIndex: number; startMinutes: number; endMinutes: number };

export function LessonCalendar({
  dayStartValues,
  lessons: initialLessons,
  students,
}: {
  dayStartValues: string[];
  lessons: CalendarLesson[];
  students: { id: string; name: string }[];
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
  const [popover, setPopover] = useState<PopoverState | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

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
    setPopover({ dayIndex, startMinutes, endMinutes });
  }

  function handleCreated(lesson: CalendarLesson) {
    setLessons((prev) => [...prev, lesson]);
    setPopover(null);
    router.refresh();
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {error && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div
        className="flex border-b border-slate-200 bg-slate-50"
        style={{ paddingLeft: GUTTER_PX }}
      >
        {days.map((day) => {
          const isToday = isSameDay(day, now);
          return (
            <div
              key={day.toISOString()}
              className={`flex-1 border-l border-slate-200 px-2 py-2.5 text-center first:border-l-0 ${
                isToday ? "bg-blue-50/60" : ""
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {formatWeekdayShort(day)}
              </p>
              <p
                className={`mt-0.5 text-sm font-semibold ${isToday ? "text-blue-700" : "text-slate-700"}`}
              >
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex overflow-x-auto">
        <div className="shrink-0 select-none" style={{ width: GUTTER_PX }}>
          {HOURS.map((hour) => (
            <div key={hour} className="relative text-right" style={{ height: PX_PER_HOUR }}>
              <span className="absolute -top-2 right-2 text-[11px] text-slate-400">
                {formatHourLabel(hour)}
              </span>
            </div>
          ))}
        </div>

        <div ref={gridRef} className="relative flex min-w-0 flex-1" style={{ height: GRID_HEIGHT }}>
          {HOURS.map((hour, index) => (
            <div
              key={hour}
              className="pointer-events-none absolute inset-x-0 border-t border-slate-100"
              style={{ top: index * PX_PER_HOUR }}
            />
          ))}

          {days.map((day, dayIndex) => {
            const isToday = isSameDay(day, now);
            const dayLessons = lessons.filter((lesson) =>
              isSameDay(new Date(lesson.startTime), day),
            );

            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: pointer-only calendar creation, keyboard users use the "Schedule lesson" button
              // biome-ignore lint/a11y/noStaticElementInteractions: a day column with a click-to-create affordance, containing focusable lesson buttons
              <div
                key={day.toISOString()}
                className={`relative flex-1 border-l border-slate-100 first:border-l-0 ${isToday ? "bg-blue-50/30" : ""}`}
                onClick={(event) => handleColumnClick(event, dayIndex)}
              >
                {isToday && now.getHours() >= START_HOUR && now.getHours() < END_HOUR && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-rose-400"
                    style={{
                      top: ((minutesSinceMidnight(now) - START_HOUR * 60) / 60) * PX_PER_HOUR,
                    }}
                  >
                    <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-rose-400" />
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

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onPointerDown={(event) => handleBlockPointerDown(event, lesson, dayIndex)}
                      onPointerMove={handleBlockPointerMove}
                      onPointerUp={(event) => handleBlockPointerUp(event, lesson)}
                      className={`absolute inset-x-1 z-20 overflow-hidden rounded-md px-2 text-left text-xs shadow-sm transition-colors ${STATUS_BLOCK_CLASSES[lesson.status]} ${isDragging ? "cursor-grabbing opacity-90 shadow-lg" : "cursor-grab"}`}
                      style={{ top, height }}
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

      {popover && (
        <CreateLessonPopover
          day={days[popover.dayIndex]}
          startMinutes={popover.startMinutes}
          endMinutes={popover.endMinutes}
          students={students}
          onClose={() => setPopover(null)}
          onCreated={handleCreated}
          onError={setError}
        />
      )}
    </div>
  );
}

function CreateLessonPopover({
  day,
  startMinutes,
  endMinutes,
  students,
  onClose,
  onCreated,
  onError,
}: {
  day: Date;
  startMinutes: number;
  endMinutes: number;
  students: { id: string; name: string }[];
  onClose: () => void;
  onCreated: (lesson: CalendarLesson) => void;
  onError: (message: string) => void;
}) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [startValue, setStartValue] = useState(minutesToTimeInputValue(startMinutes));
  const [endValue, setEndValue] = useState(minutesToTimeInputValue(endMinutes));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function submit() {
    const student = students.find((item) => item.id === studentId);
    const startMin = timeInputValueToMinutes(startValue);
    const endMin = timeInputValueToMinutes(endValue);
    if (!student || startMin === null || endMin === null) {
      onError("Choose a student and valid times.");
      return;
    }
    if (endMin <= startMin) {
      onError("End time must be after start time.");
      return;
    }

    const start = new Date(day);
    start.setMinutes(startMin);
    const end = new Date(day);
    end.setMinutes(endMin);

    startTransition(async () => {
      const result = await quickCreateLessonAction({
        studentId: student.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      if ("error" in result) {
        onError(result.error ?? "Unable to schedule lesson.");
        return;
      }
      onCreated({
        id: result.id,
        studentId: student.id,
        studentName: student.name,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: "scheduled",
      });
    });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/20 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-900">
          New lesson ·{" "}
          {day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </h3>
        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="quick-student"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Student
            </label>
            <select
              id="quick-student"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              className={inputClassName}
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="quick-start"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Start
              </label>
              <input
                id="quick-start"
                type="time"
                value={startValue}
                onChange={(event) => setStartValue(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="quick-end" className="mb-1 block text-sm font-medium text-slate-700">
                End
              </label>
              <input
                id="quick-end"
                type="time"
                value={endValue}
                onChange={(event) => setEndValue(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? "Scheduling…" : "Schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
