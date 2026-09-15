"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import { DatePicker } from "../../../components/DatePicker";
import { Select } from "../../../components/Select";
import { CURRENCIES } from "../../rates/schemas";
import { PAYMENT_METHODS, PAYMENT_STATUSES, type PaymentMethod, type PaymentStatus } from "../schemas";
import type { LessonActionState } from "../actions";
import { combineDateAndMinutes, startOfDay, toDateParam } from "../date-utils";
import { DEFAULT_RATE_KEY } from "../rates-map";
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
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
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
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    defaultValues?.paymentStatus ?? "unpaid",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(
    defaultValues?.paymentMethod ?? "",
  );
  const [repeat, setRepeat] = useState(false);

  const rate =
    ratesByStudent?.[studentId]?.[subjectId] ?? ratesByStudent?.[studentId]?.[DEFAULT_RATE_KEY];

  useEffect(() => {
    if (priceTouched || !rate) return;
    const computed = Math.round((rate.hourlyRate * durationMinutes) / 60);
    setPrice(String(computed));
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
        <Select
          id="studentId"
          name="studentId"
          value={studentId}
          onChange={setStudentId}
          placeholder="Select a student"
          options={students.map((student) => ({ value: student.id, label: student.name }))}
        />
      </Field>

      <Field label="Subject" htmlFor="subjectId" errors={state.fieldErrors?.subjectId}>
        <Select
          id="subjectId"
          name="subjectId"
          value={subjectId}
          onChange={setSubjectId}
          options={[
            { value: "", label: "No subject" },
            ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
          ]}
        />
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
            step={1}
            inputMode="numeric"
            value={price}
            onChange={(event) => {
              setPriceTouched(true);
              setPrice(event.target.value.replace(/[^0-9]/g, ""));
            }}
            className={inputClassName}
          />
        </Field>

        <Field label="Currency" htmlFor="currency" errors={state.fieldErrors?.currency}>
          <Select
            id="currency"
            name="currency"
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES.map((code) => ({ value: code, label: code }))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Payment status"
          htmlFor="paymentStatus"
          errors={state.fieldErrors?.paymentStatus}
        >
          <Select
            id="paymentStatus"
            name="paymentStatus"
            value={paymentStatus}
            onChange={(value) => setPaymentStatus(value as PaymentStatus)}
            options={PAYMENT_STATUSES.map((value) => ({
              value,
              label: value === "paid" ? "Paid" : "Unpaid",
            }))}
          />
        </Field>

        <Field
          label="Payment method"
          htmlFor="paymentMethod"
          errors={state.fieldErrors?.paymentMethod}
        >
          <Select
            id="paymentMethod"
            name="paymentMethod"
            value={paymentMethod}
            onChange={(value) => setPaymentMethod(value as PaymentMethod | "")}
            placeholder="Not set"
            options={PAYMENT_METHODS.map((value) => ({ value, label: value }))}
          />
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
              <DatePicker id="repeatUntil" name="repeatUntil" minDate={startOfDay(new Date())} />
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
