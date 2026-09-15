"use client";

import { useState } from "react";
import { Button } from "../../../components/Button";
import type { LessonActionState } from "../actions";
import { formatTimeRange, minutesSinceMidnight, toDateParam } from "../date-utils";
import type { PaymentMethod, PaymentStatus } from "../schemas";
import type { PickerLesson } from "./LessonDateTimePicker";
import { LessonForm, type RatesByStudent } from "./LessonForm";

export function LessonDetailsCard({
  action,
  lessonId,
  students,
  subjects,
  ratesByStudent,
  pickerLessons,
  defaultValues,
  studentName,
  subjectName,
}: {
  action: (state: LessonActionState, formData: FormData) => Promise<LessonActionState>;
  lessonId: string;
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  ratesByStudent: RatesByStudent;
  pickerLessons: PickerLesson[];
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
}) {
  const [editing, setEditing] = useState(false);
  const startTime = new Date(defaultValues.startTimeIso);
  const endTime = new Date(startTime.getTime() + defaultValues.durationMinutes * 60000);

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Details</h2>
          <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
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
            {formatTimeRange(startTime.toISOString(), endTime.toISOString())}
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

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-ink">Edit details</h2>
      <LessonForm
        action={action}
        lessonId={lessonId}
        students={students}
        subjects={subjects}
        ratesByStudent={ratesByStudent}
        pickerLessons={pickerLessons}
        defaultValues={{
          ...defaultValues,
          dateParam: toDateParam(startTime),
          minutes: minutesSinceMidnight(startTime),
        }}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        onCancel={() => setEditing(false)}
      />
    </div>
  );
}
