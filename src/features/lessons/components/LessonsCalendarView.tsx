"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, LinkButton } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { PageHeader } from "../../../components/PageHeader";
import type { RatesByStudent } from "./LessonForm";
import { LessonForm } from "./LessonForm";
import type { PickerLesson } from "./LessonDateTimePicker";
import { createLessonAction } from "../actions";
import { toDateParam } from "../date-utils";
import { LessonCalendar, type CalendarLesson } from "./LessonCalendar";

const navLinkClass =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted";
const toggleActiveClass = "rounded-md bg-brand px-3 py-1 text-sm font-medium text-on-brand";
const toggleInactiveClass =
  "rounded-md px-3 py-1 text-sm font-medium text-ink-muted hover:bg-surface-muted";

type Prefill = { dateParam: string; minutes: number; durationMinutes: number };

export function LessonsCalendarView({
  title,
  description,
  prevHref,
  todayHref,
  nextHref,
  dayHref,
  weekHref,
  view,
  dayStartValues,
  lessons,
  students,
  subjects,
  ratesByStudent,
  pickerLessons,
  initialCreate,
  highlightLessonId,
}: {
  title: string;
  description: string;
  prevHref: string;
  todayHref: string;
  nextHref: string;
  dayHref: string;
  weekHref: string;
  view: "day" | "week";
  dayStartValues: string[];
  lessons: CalendarLesson[];
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  ratesByStudent: RatesByStudent;
  pickerLessons: PickerLesson[];
  initialCreate: boolean;
  highlightLessonId: string | null;
}) {
  const router = useRouter();
  const [createPrefill, setCreatePrefill] = useState<Prefill | null>(
    initialCreate
      ? { dateParam: toDateParam(new Date()), minutes: 9 * 60, durationMinutes: 60 }
      : null,
  );

  function closeModal() {
    setCreatePrefill(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          students.length === 0 ? (
            <LinkButton href="/dashboard/students/new">Add student first</LinkButton>
          ) : (
            <Button
              onClick={() =>
                setCreatePrefill({
                  dateParam: toDateParam(new Date()),
                  minutes: 9 * 60,
                  durationMinutes: 60,
                })
              }
            >
              Schedule lesson
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={prevHref} className={navLinkClass}>
            &larr; Prev
          </Link>
          <Link href={todayHref} className={navLinkClass}>
            Today
          </Link>
          <Link href={nextHref} className={navLinkClass}>
            Next &rarr;
          </Link>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <Link href={dayHref} className={view === "day" ? toggleActiveClass : toggleInactiveClass}>
            Day
          </Link>
          <Link
            href={weekHref}
            className={view === "week" ? toggleActiveClass : toggleInactiveClass}
          >
            Week
          </Link>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="text-xs text-ink-subtle">Add a student before you can schedule a lesson.</p>
      ) : (
        <p className="text-xs text-ink-subtle">
          Click an empty slot to schedule a lesson, or drag a lesson to reschedule it.
        </p>
      )}

      <LessonCalendar
        dayStartValues={dayStartValues}
        lessons={lessons}
        students={students}
        highlightLessonId={highlightLessonId}
        onSlotClick={(dayIndex, startMinutes, endMinutes) => {
          const day = new Date(dayStartValues[dayIndex]);
          setCreatePrefill({
            dateParam: toDateParam(day),
            minutes: startMinutes,
            durationMinutes: Math.max(15, endMinutes - startMinutes),
          });
        }}
      />

      {createPrefill && students.length > 0 && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <h3 className="mb-4 text-sm font-semibold text-ink">Schedule lesson</h3>
            <LessonForm
              action={createLessonAction}
              students={students}
              subjects={subjects}
              ratesByStudent={ratesByStudent}
              pickerLessons={pickerLessons}
              allowRecurrence
              defaultValues={{
                studentId: students[0]?.id ?? "",
                dateParam: createPrefill.dateParam,
                minutes: createPrefill.minutes,
                durationMinutes: createPrefill.durationMinutes,
                notes: "",
              }}
              submitLabel="Schedule lesson"
              pendingLabel="Scheduling…"
              onCancel={closeModal}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
