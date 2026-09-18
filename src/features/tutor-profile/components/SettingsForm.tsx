"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import { Select } from "../../../components/Select";
import { CURRENCIES } from "../../rates/schemas";
import type { TutorProfileActionState } from "../actions";

const initialState: TutorProfileActionState = {};

const LOCALE_OPTIONS = [
  { value: "en-US", label: "English (en-US)" },
  { value: "ru-RU", label: "Russian (ru-RU)" },
  { value: "de-DE", label: "German (de-DE)" },
  { value: "es-ES", label: "Spanish (es-ES)" },
];

function timezoneOptions() {
  const names =
    typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];
  return names.map((name) => ({ value: name, label: name.replace(/_/g, " ") }));
}

/** "HH:MM" (24h, on the half hour) -> "7:00 AM" for a readable option label. */
function formatTimeLabel(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours < 12 ? "AM" : "PM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Half-hour increments from 00:00 to 23:30 — the working-hours schema only accepts "HH:MM"
// within a single day (no 24:00), matching what a native time input could produce anyway.
const WORKING_HOURS_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
    .toString()
    .padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  const value = `${hours}:${minutes}`;
  return { value, label: formatTimeLabel(value) };
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save settings"}
    </Button>
  );
}

export function SettingsForm({
  action,
  defaultValues,
}: {
  action: (state: TutorProfileActionState, formData: FormData) => Promise<TutorProfileActionState>;
  defaultValues: {
    name: string;
    timezone: string;
    locale: string;
    currency: string;
    defaultHourlyRate: string;
    paymentInstructions: string;
    contactEmail: string;
    contactPhone: string;
    workingHoursStart: string;
    workingHoursEnd: string;
  };
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [timezone, setTimezone] = useState(defaultValues.timezone);
  const [locale, setLocale] = useState(defaultValues.locale);
  const [currency, setCurrency] = useState(defaultValues.currency);
  const [timezoneOpts] = useState(timezoneOptions);
  const [workingHoursStart, setWorkingHoursStart] = useState(defaultValues.workingHoursStart);
  const [workingHoursEnd, setWorkingHoursEnd] = useState(defaultValues.workingHoursEnd);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-lg border border-brand/25 bg-brand/10 p-3 text-sm text-brand">
          {state.message}
        </p>
      )}

      <Field label="Your name" htmlFor="name" errors={state.fieldErrors?.name}>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultValues.name}
          placeholder="Shown to students and in the app"
          className={inputClassName}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Timezone" htmlFor="timezone" errors={state.fieldErrors?.timezone}>
          <Select
            id="timezone"
            name="timezone"
            value={timezone}
            onChange={setTimezone}
            options={timezoneOpts}
          />
        </Field>

        <Field label="Language" htmlFor="locale" errors={state.fieldErrors?.locale}>
          <Select
            id="locale"
            name="locale"
            value={locale}
            onChange={setLocale}
            options={LOCALE_OPTIONS}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Default currency" htmlFor="currency" errors={state.fieldErrors?.currency}>
          <Select
            id="currency"
            name="currency"
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES.map((code) => ({ value: code, label: code }))}
          />
        </Field>

        <Field
          label="Default hourly rate"
          htmlFor="defaultHourlyRate"
          hint="Used to prefill new students' rates"
          errors={state.fieldErrors?.defaultHourlyRate}
        >
          <input
            id="defaultHourlyRate"
            name="defaultHourlyRate"
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            defaultValue={defaultValues.defaultHourlyRate}
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Contact email"
          htmlFor="contactEmail"
          hint="Shown to students on the Teacher page"
          errors={state.fieldErrors?.contactEmail}
        >
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={defaultValues.contactEmail}
            className={inputClassName}
          />
        </Field>

        <Field
          label="Contact phone"
          htmlFor="contactPhone"
          errors={state.fieldErrors?.contactPhone}
        >
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            defaultValue={defaultValues.contactPhone}
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Working hours start"
          htmlFor="workingHoursStart"
          hint="Bounds the calendar view and when lessons can be scheduled"
          errors={state.fieldErrors?.workingHoursStartMinutes}
        >
          <Select
            id="workingHoursStart"
            name="workingHoursStart"
            value={workingHoursStart}
            onChange={setWorkingHoursStart}
            options={WORKING_HOURS_OPTIONS}
          />
        </Field>

        <Field
          label="Working hours end"
          htmlFor="workingHoursEnd"
          errors={state.fieldErrors?.workingHoursEndMinutes}
        >
          <Select
            id="workingHoursEnd"
            name="workingHoursEnd"
            value={workingHoursEnd}
            onChange={setWorkingHoursEnd}
            options={WORKING_HOURS_OPTIONS}
          />
        </Field>
      </div>

      <Field
        label="Payment instructions"
        htmlFor="paymentInstructions"
        hint="Shown to students when they owe you money"
        errors={state.fieldErrors?.paymentInstructions}
      >
        <textarea
          id="paymentInstructions"
          name="paymentInstructions"
          rows={4}
          defaultValue={defaultValues.paymentInstructions}
          className={inputClassName}
        />
      </Field>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
