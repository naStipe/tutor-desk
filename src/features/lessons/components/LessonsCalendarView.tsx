"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, LinkButton } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Modal } from "../../../components/Modal";
import { PageHeader } from "../../../components/PageHeader";
import type { RatesByStudent } from "./LessonForm";
import { LessonForm } from "./LessonForm";
import type { PickerLesson } from "./LessonDateTimePicker";
import { createLessonAction } from "../actions";
import { toDateParam } from "../date-utils";
import { CalendarLegend } from "./CalendarLegend";
import { LessonCalendar, type CalendarLesson } from "./LessonCalendar";
import { MonthCalendar } from "./MonthCalendar";
import { type AgendaHomework, type AgendaLesson, ScheduleAgenda } from "./ScheduleAgenda";

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
  homeworkDueCountByDate,
  homeworkReviewCountByDate,
  agendaLessons,
  agendaHomework,
  timeZone,
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
  homeworkDueCountByDate: Record<string, number>;
  homeworkReviewCountByDate: Record<string, number>;
  agendaLessons: AgendaLesson[];
  agendaHomework: AgendaHomework[];
  timeZone?: string;
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

      <CalendarLegend reviewLabel="Ready for review" />

      {view === "month" ? (
        <>
          <Card>
            <MonthCalendar
              month={new Date(monthAnchorValue)}
              onMonthChange={(month) =>
                router.push(`/dashboard/schedule?view=month&date=${toDateParam(month)}`)
              }
              selectedDate={null}
              onSelectDate={(dateParam) =>
                router.push(`/dashboard/schedule?view=day&date=${dateParam}`)
              }
              countByDate={monthCountByDate}
              homeworkCountByDate={homeworkDueCountByDate}
              reviewCountByDate={homeworkReviewCountByDate}
            />
          </Card>
          <ScheduleAgenda lessons={agendaLessons} homework={agendaHomework} timeZone={timeZone} />
        </>
      ) : view === "day" ? (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="lg:shrink-0">
            {students.length === 0 ? (
              <p className="text-xs text-ink-subtle">
                Add a student before you can schedule a lesson.
              </p>
            ) : (
              <p className="text-xs text-ink-subtle">
                Click an empty slot to schedule a lesson, or drag a lesson to reschedule it.
              </p>
            )}

            <div className="mt-3">
              <LessonCalendar
                dayStartValues={dayStartValues}
                lessons={lessons}
                students={students}
                highlightLessonId={highlightLessonId}
                homeworkDueCountByDate={homeworkDueCountByDate}
                homeworkReviewCountByDate={homeworkReviewCountByDate}
                onSlotClick={(dayIndex, startMinutes, endMinutes) => {
                  const day = new Date(dayStartValues[dayIndex]);
                  setCreatePrefill({
                    dateParam: toDateParam(day),
                    minutes: startMinutes,
                    durationMinutes: Math.max(15, endMinutes - startMinutes),
                  });
                }}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <ScheduleAgenda
              lessons={agendaLessons}
              homework={agendaHomework}
              timeZone={timeZone}
              singleColumn
            />
          </div>
        </div>
      ) : (
        <>
          {students.length === 0 ? (
            <p className="text-xs text-ink-subtle">
              Add a student before you can schedule a lesson.
            </p>
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
            homeworkDueCountByDate={homeworkDueCountByDate}
            homeworkReviewCountByDate={homeworkReviewCountByDate}
            onSlotClick={(dayIndex, startMinutes, endMinutes) => {
              const day = new Date(dayStartValues[dayIndex]);
              setCreatePrefill({
                dateParam: toDateParam(day),
                minutes: startMinutes,
                durationMinutes: Math.max(15, endMinutes - startMinutes),
              });
            }}
          />

          <ScheduleAgenda lessons={agendaLessons} homework={agendaHomework} timeZone={timeZone} />
        </>
      )}

      <Modal
        open={Boolean(createPrefill && students.length > 0)}
        onClose={closeModal}
        title="Schedule lesson"
      >
        {createPrefill && (
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
        )}
      </Modal>
    </div>
  );
}
