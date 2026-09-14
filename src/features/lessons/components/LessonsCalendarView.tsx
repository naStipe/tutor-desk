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
import { MonthCalendar } from "./MonthCalendar";
import { XIcon } from "../../../components/icons";

const navLinkClass =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted";
const toggleActiveClass = "rounded-md bg-brand px-3 py-1 text-sm font-medium text-on-brand";
const toggleInactiveClass =
  "rounded-md px-3 py-1 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted";

type Prefill = { dateParam: string; minutes: number; durationMinutes: number };
type View = "day" | "week" | "month";

export function LessonsCalendarView({
  title,
  description,
  prevHref,
  todayHref,
  nextHref,
  dayHref,
  weekHref,
  monthHref,
  view,
  dayStartValues,
  lessons,
  students,
  subjects,
  ratesByStudent,
  pickerLessons,
  initialCreate,
  highlightLessonId,
  monthCountByDate,
  monthAnchorValue,
  showHomework,
  homeworkCountByDate,
  homeworkItems,
}: {
  title: string;
  description: string;
  prevHref: string;
  todayHref: string;
  nextHref: string;
  dayHref: string;
  weekHref: string;
  monthHref: string;
  view: View;
  dayStartValues: string[];
  lessons: CalendarLesson[];
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  ratesByStudent: RatesByStudent;
  pickerLessons: PickerLesson[];
  initialCreate: boolean;
  highlightLessonId: string | null;
  monthCountByDate: Record<string, number>;
  monthAnchorValue: string;
  showHomework: boolean;
  homeworkCountByDate: Record<string, number>;
  homeworkItems: { id: string; title: string; studentName: string; dueDate: string; status: string }[];
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

  function toggleHomework(checked: boolean) {
    const url = new URL(window.location.href);
    if (checked) {
      url.searchParams.set("homework", "1");
    } else {
      url.searchParams.delete("homework");
    }
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
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
        {view === "month" ? (
          <Link href={todayHref} className={navLinkClass}>
            Today
          </Link>
        ) : (
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
        )}
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
          <Link
            href={monthHref}
            className={view === "month" ? toggleActiveClass : toggleInactiveClass}
          >
            Month
          </Link>
        </div>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={showHomework}
          onChange={(event) => toggleHomework(event.target.checked)}
          className="h-4 w-4 rounded border-border text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        Show homework due dates
      </label>

      {view === "month" ? (
        <Card>
          <MonthCalendar
            month={new Date(monthAnchorValue)}
            onMonthChange={(month) =>
              router.push(
                `/dashboard/schedule?view=month&date=${toDateParam(month)}${showHomework ? "&homework=1" : ""}`,
              )
            }
            selectedDate={null}
            onSelectDate={(dateParam) =>
              router.push(
                `/dashboard/schedule?view=day&date=${dateParam}${showHomework ? "&homework=1" : ""}`,
              )
            }
            countByDate={monthCountByDate}
            homeworkCountByDate={showHomework ? homeworkCountByDate : undefined}
          />
        </Card>
      ) : (
        <>
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
            homeworkItems={showHomework ? homeworkItems : []}
            onSlotClick={(dayIndex, startMinutes, endMinutes) => {
              const day = new Date(dayStartValues[dayIndex]);
              setCreatePrefill({
                dateParam: toDateParam(day),
                minutes: startMinutes,
                durationMinutes: Math.max(15, endMinutes - startMinutes),
              });
            }}
          />
        </>
      )}

      {createPrefill && students.length > 0 && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
          <Card className="td-modal-pop flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden p-0">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
              <h3 className="text-sm font-semibold text-ink">Schedule lesson</h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="rounded-full p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
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
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
