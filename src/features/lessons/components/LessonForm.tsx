"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import type { LessonActionState } from "../actions";
import { dateTimeLocalToISO } from "../date-utils";

const initialState: LessonActionState = {};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

type LessonFormProps = {
  action: (state: LessonActionState, formData: FormData) => Promise<LessonActionState>;
  lessonId?: string;
  students: { id: string; name: string }[];
  defaultValues?: {
    studentId: string;
    startTime: string; // datetime-local value
    endTime: string; // datetime-local value
    notes: string;
  };
  submitLabel: string;
  pendingLabel: string;
};

export function LessonForm({
  action,
  lessonId,
  students,
  defaultValues,
  submitLabel,
  pendingLabel,
}: LessonFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [startTimeIso, setStartTimeIso] = useState(defaultValues?.startTime ?? "");
  const [endTimeIso, setEndTimeIso] = useState(defaultValues?.endTime ?? "");

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {lessonId && <input type="hidden" name="id" value={lessonId} />}
      <input type="hidden" name="startTime" value={dateTimeLocalToISO(startTimeIso)} />
      <input type="hidden" name="endTime" value={dateTimeLocalToISO(endTimeIso)} />

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {state.error}
        </p>
      )}

      <Field label="Student" htmlFor="studentId" required errors={state.fieldErrors?.studentId}>
        <select
          id="studentId"
          name="studentId"
          defaultValue={defaultValues?.studentId ?? ""}
          className={inputClassName}
        >
          <option value="" disabled>
            Select a student
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Start"
          htmlFor="startTimeLocal"
          required
          errors={state.fieldErrors?.startTime}
        >
          <input
            id="startTimeLocal"
            type="datetime-local"
            value={startTimeIso}
            onChange={(event) => setStartTimeIso(event.target.value)}
            className={inputClassName}
          />
        </Field>

        <Field label="End" htmlFor="endTimeLocal" required errors={state.fieldErrors?.endTime}>
          <input
            id="endTimeLocal"
            type="datetime-local"
            value={endTimeIso}
            onChange={(event) => setEndTimeIso(event.target.value)}
            className={inputClassName}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes" errors={state.fieldErrors?.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes}
          className={inputClassName}
        />
      </Field>

      <div className="pt-2">
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      </div>
    </form>
  );
}
