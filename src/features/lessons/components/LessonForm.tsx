"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import { CURRENCIES } from "../../rates/schemas";
import type { LessonActionState } from "../actions";
import { combineDateAndMinutes, startOfDay, toDateParam } from "../date-utils";
import { LessonDateTimePicker, type PickerLesson } from "./LessonDateTimePicker";

const initialState: LessonActionState = {};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export type RatesByStudent = Record<
  string,
  Record<string, { hourlyRate: number; currency: string }>
>;

type LessonFormProps = {
  action: (state: LessonActionState, formData: FormData) => Promise<LessonActionState>;
  lessonId?: string;
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  ratesByStudent?: RatesByStudent;
  allowRecurrence?: boolean;
  /** Other lessons, used to show per-day counts and block out busy slots in the picker. */
  pickerLessons?: PickerLesson[];
  defaultValues?: {
    studentId: string;
    subjectId?: string;
    dateParam: string; // YYYY-MM-DD
    minutes: number; // minutes since midnight
    durationMinutes: number;
    notes: string;
    price?: string;
    currency?: string;
  };
  submitLabel: string;
  pendingLabel: string;
  onCancel?: () => void;
};

export function LessonForm({
  action,
  lessonId,
  students,
  subjects,
  ratesByStudent,
  allowRecurrence,
  pickerLessons,
  defaultValues,
  submitLabel,
  pendingLabel,
  onCancel,
}: LessonFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [dateParam, setDateParam] = useState(defaultValues?.dateParam ?? toDateParam(new Date()));
  const [minutes, setMinutes] = useState<number | null>(defaultValues?.minutes ?? null);
  const [studentId, setStudentId] = useState(defaultValues?.studentId ?? students[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(defaultValues?.subjectId ?? "");
  const [durationMinutes, setDurationMinutes] = useState(defaultValues?.durationMinutes ?? 60);
  const [priceTouched, setPriceTouched] = useState(Boolean(defaultValues?.price));
  const [price, setPrice] = useState(defaultValues?.price ?? "");
  const [currency, setCurrency] = useState(defaultValues?.currency ?? "RUB");
  const [repeat, setRepeat] = useState(false);

  const rate = ratesByStudent?.[studentId]?.[subjectId];

  useEffect(() => {
    if (priceTouched || !rate) return;
    const computed = (rate.hourlyRate * durationMinutes) / 60;
    setPrice(computed.toFixed(2));
    setCurrency(rate.currency);
  }, [rate, durationMinutes, priceTouched]);

  const startTime = minutes !== null ? combineDateAndMinutes(dateParam, minutes).toISOString() : "";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {lessonId && <input type="hidden" name="id" value={lessonId} />}
      <input type="hidden" name="startTime" value={startTime} />
      <input type="hidden" name="durationMinutes" value={durationMinutes} />

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <Field label="Student" htmlFor="studentId" required errors={state.fieldErrors?.studentId}>
        <select
          id="studentId"
          name="studentId"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          className={inputClassName}
        >
          {students.length === 0 && (
            <option value="" disabled>
              Select a student
            </option>
          )}
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Subject" htmlFor="subjectId" errors={state.fieldErrors?.subjectId}>
        <select
          id="subjectId"
          name="subjectId"
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
          className={inputClassName}
        >
          <option value="">No subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Date & time"
        htmlFor="durationMinutes"
        required
        errors={state.fieldErrors?.startTime ?? state.fieldErrors?.durationMinutes}
      >
        <LessonDateTimePicker
          lessons={pickerLessons ?? []}
          excludeLessonId={lessonId}
          dateParam={dateParam}
          minutes={minutes}
          durationMinutes={durationMinutes}
          onChangeDate={setDateParam}
          onChangeMinutes={setMinutes}
          onChangeDuration={setDurationMinutes}
          minDate={lessonId ? undefined : startOfDay(new Date())}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Price" htmlFor="price" errors={state.fieldErrors?.price}>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(event) => {
              setPriceTouched(true);
              setPrice(event.target.value);
            }}
            className={inputClassName}
          />
        </Field>

        <Field label="Currency" htmlFor="currency" errors={state.fieldErrors?.currency}>
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className={inputClassName}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {allowRecurrence && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="repeat"
              checked={repeat}
              onChange={(event) => setRepeat(event.target.checked)}
              className="h-4 w-4 rounded border-border-strong text-brand focus:outline-brand/25"
            />
            Repeat weekly
          </label>
          {repeat && (
            <Field
              label="Until (optional)"
              htmlFor="repeatUntil"
              errors={state.fieldErrors?.repeatUntil}
              hint="Leave blank to keep repeating until you cancel it."
            >
              <input id="repeatUntil" name="repeatUntil" type="date" className={inputClassName} />
            </Field>
          )}
        </div>
      )}

      <Field label="Notes" htmlFor="notes" errors={state.fieldErrors?.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes}
          className={inputClassName}
        />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
