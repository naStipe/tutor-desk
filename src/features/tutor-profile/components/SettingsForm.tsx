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
          <input
            id="workingHoursStart"
            name="workingHoursStart"
            type="time"
            defaultValue={defaultValues.workingHoursStart}
            className={inputClassName}
          />
        </Field>

        <Field
          label="Working hours end"
          htmlFor="workingHoursEnd"
          errors={state.fieldErrors?.workingHoursEndMinutes}
        >
          <input
            id="workingHoursEnd"
            name="workingHoursEnd"
            type="time"
            defaultValue={defaultValues.workingHoursEnd}
            className={inputClassName}
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
