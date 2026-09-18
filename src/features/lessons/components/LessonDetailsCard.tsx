"use client";

import { useState, useTransition } from "react";
import { Button } from "../../../components/Button";
import type { LessonActionState } from "../actions";
import { getLessonEditDataAction } from "../actions";
import { formatTimeRange, minutesSinceMidnightInZone, toDateParamInZone } from "../date-utils";
import type { PaymentMethod, PaymentStatus } from "../schemas";
import type { PickerLesson } from "./LessonDateTimePicker";
import { LessonForm, type RatesByStudent } from "./LessonForm";

type EditData = {
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  ratesByStudent: RatesByStudent;
  pickerLessons: PickerLesson[];
};

export function LessonDetailsCard({
  action,
  lessonId,
  defaultValues,
  studentName,
  subjectName,
  timeZone,
  locale = "en-US",
  workingHoursStartMinutes,
  workingHoursEndMinutes,
}: {
  action: (state: LessonActionState, formData: FormData) => Promise<LessonActionState>;
  lessonId: string;
  defaultValues: {
    studentId: string;
    subjectId?: string;
    startTimeIso: string;
    durationMinutes: number;
    notes: string;
    meetingUrl?: string;
    price?: string;
    currency?: string;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
  };
  studentName: string;
  subjectName: string | null;
  timeZone?: string;
  locale?: string;
  workingHoursStartMinutes?: number;
  workingHoursEndMinutes?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [isPending, startTransition] = useTransition();
  const startTime = new Date(defaultValues.startTimeIso);
  const endTime = new Date(startTime.getTime() + defaultValues.durationMinutes * 60000);

  function openEditor() {
    setEditing(true);
    if (editData) return;
    startTransition(async () => {
      const data = await getLessonEditDataAction({
        id: defaultValues.studentId,
        name: studentName,
      });
      setEditData(data);
    });
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Details</h2>
          <Button type="button" variant="secondary" onClick={openEditor}>
            Edit
          </Button>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-ink-subtle">Student</dt>
          <dd className="text-ink">{studentName}</dd>
          <dt className="text-ink-subtle">Subject</dt>
          <dd className="text-ink">{subjectName ?? "—"}</dd>
          <dt className="text-ink-subtle">Time</dt>
          <dd className="text-ink">
            {formatTimeRange(startTime.toISOString(), endTime.toISOString(), timeZone, locale)}
          </dd>
          <dt className="text-ink-subtle">Duration</dt>
          <dd className="text-ink">{defaultValues.durationMinutes} min</dd>
          {defaultValues.notes && (
            <>
              <dt className="text-ink-subtle">Notes</dt>
              <dd className="whitespace-pre-wrap text-ink">{defaultValues.notes}</dd>
            </>
          )}
        </dl>
      </div>
    );
  }

  if (isPending || !editData) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Edit details</h2>
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-ink">Edit details</h2>
      <LessonForm
        action={action}
        lessonId={lessonId}
        students={editData.students}
        subjects={editData.subjects}
        ratesByStudent={editData.ratesByStudent}
        pickerLessons={editData.pickerLessons}
        locale={locale}
        timeZone={timeZone}
        workingHoursStartMinutes={workingHoursStartMinutes}
        workingHoursEndMinutes={workingHoursEndMinutes}
        defaultValues={{
          ...defaultValues,
          dateParam: toDateParamInZone(startTime, timeZone),
          minutes: minutesSinceMidnightInZone(startTime, timeZone),
        }}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        onCancel={() => setEditing(false)}
      />
    </div>
  );
}
