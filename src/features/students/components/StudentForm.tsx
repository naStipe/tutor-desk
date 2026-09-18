"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import { Select } from "../../../components/Select";
import { CURRENCIES } from "../../rates/schemas";
import type { StudentActionState } from "../actions";

const initialState: StudentActionState = {};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

type StudentFormValues = {
  name: string;
  email: string;
  phone: string;
  telegram: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianTelegram: string;
  notes: string;
  defaultHourlyRate: string;
  defaultCurrency: string;
};

/**
 * updateStudentAction overwrites the whole row from parsed form fields, so any section not shown
 * for the current tab is still submitted as a hidden input carrying its current value forward.
 */
type StudentFormSection = "full" | "identity" | "contact" | "billing";

type StudentFormProps = {
  action: (state: StudentActionState, formData: FormData) => Promise<StudentActionState>;
  studentId?: string;
  defaultValues?: StudentFormValues;
  section?: StudentFormSection;
  submitLabel: string;
  pendingLabel: string;
  /** Tutor's own defaults, used to prefill a new student's billing fields. */
  tutorDefaultCurrency?: string;
  tutorDefaultHourlyRate?: string;
};

export function StudentForm({
  action,
  studentId,
  defaultValues,
  section = "full",
  submitLabel,
  pendingLabel,
  tutorDefaultCurrency,
  tutorDefaultHourlyRate,
}: StudentFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [defaultCurrency, setDefaultCurrency] = useState(
    defaultValues?.defaultCurrency ?? tutorDefaultCurrency ?? "RUB",
  );

  const showIdentity = section === "full" || section === "identity";
  const showContact = section === "full" || section === "contact";
  const showBilling = section === "full" || section === "billing";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {studentId && <input type="hidden" name="id" value={studentId} />}
      {!showIdentity && <input type="hidden" name="name" value={defaultValues?.name ?? ""} />}
      {!showIdentity && <input type="hidden" name="notes" value={defaultValues?.notes ?? ""} />}
      {!showContact && <input type="hidden" name="email" value={defaultValues?.email ?? ""} />}
      {!showContact && <input type="hidden" name="phone" value={defaultValues?.phone ?? ""} />}
      {!showContact && (
        <input type="hidden" name="telegram" value={defaultValues?.telegram ?? ""} />
      )}
      {!showContact && (
        <input type="hidden" name="guardianName" value={defaultValues?.guardianName ?? ""} />
      )}
      {!showContact && (
        <input type="hidden" name="guardianEmail" value={defaultValues?.guardianEmail ?? ""} />
      )}
      {!showContact && (
        <input type="hidden" name="guardianPhone" value={defaultValues?.guardianPhone ?? ""} />
      )}
      {!showContact && (
        <input
          type="hidden"
          name="guardianTelegram"
          value={defaultValues?.guardianTelegram ?? ""}
        />
      )}
      {!showBilling && (
        <input
          type="hidden"
          name="defaultHourlyRate"
          value={defaultValues?.defaultHourlyRate ?? ""}
        />
      )}
      {!showBilling && <input type="hidden" name="defaultCurrency" value={defaultCurrency} />}

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      {showIdentity && (
        <>
          <Field label="Name" htmlFor="name" required errors={state.fieldErrors?.name}>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              defaultValue={defaultValues?.name}
              className={inputClassName}
            />
          </Field>

          <Field label="Note" htmlFor="notes" errors={state.fieldErrors?.notes}>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={defaultValues?.notes}
              className={inputClassName}
            />
          </Field>
        </>
      )}

      {showContact && (
        <>
          <div className="space-y-4 rounded-lg border border-border p-3">
            <h3 className="text-sm font-semibold text-ink">Learner contact</h3>
            <Field label="Email" htmlFor="email" errors={state.fieldErrors?.email}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={defaultValues?.email}
                className={inputClassName}
              />
            </Field>

            <Field label="Phone" htmlFor="phone" errors={state.fieldErrors?.phone}>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={defaultValues?.phone}
                className={inputClassName}
              />
            </Field>

            <Field label="Telegram" htmlFor="telegram" errors={state.fieldErrors?.telegram}>
              <input
                id="telegram"
                name="telegram"
                type="text"
                placeholder="@username"
                defaultValue={defaultValues?.telegram}
                className={inputClassName}
              />
            </Field>
          </div>

          <div className="space-y-4 rounded-lg border border-border p-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Payer / guardian contact</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Who to reach about scheduling and payment, if different from the learner — for
                example a parent.
              </p>
            </div>

            <Field label="Name" htmlFor="guardianName" errors={state.fieldErrors?.guardianName}>
              <input
                id="guardianName"
                name="guardianName"
                type="text"
                autoComplete="name"
                defaultValue={defaultValues?.guardianName}
                className={inputClassName}
              />
            </Field>

            <Field label="Email" htmlFor="guardianEmail" errors={state.fieldErrors?.guardianEmail}>
              <input
                id="guardianEmail"
                name="guardianEmail"
                type="email"
                autoComplete="email"
                defaultValue={defaultValues?.guardianEmail}
                className={inputClassName}
              />
            </Field>

            <Field label="Phone" htmlFor="guardianPhone" errors={state.fieldErrors?.guardianPhone}>
              <input
                id="guardianPhone"
                name="guardianPhone"
                type="tel"
                autoComplete="tel"
                defaultValue={defaultValues?.guardianPhone}
                className={inputClassName}
              />
            </Field>

            <Field
              label="Telegram"
              htmlFor="guardianTelegram"
              errors={state.fieldErrors?.guardianTelegram}
            >
              <input
                id="guardianTelegram"
                name="guardianTelegram"
                type="text"
                placeholder="@username"
                defaultValue={defaultValues?.guardianTelegram}
                className={inputClassName}
              />
            </Field>
          </div>
        </>
      )}

      {showBilling && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-border p-3 sm:grid-cols-2">
          <Field
            label="Default price"
            htmlFor="defaultHourlyRate"
            hint="Used to prefill new lessons, unless a subject has its own rate"
            errors={state.fieldErrors?.defaultHourlyRate}
          >
            <input
              id="defaultHourlyRate"
              name="defaultHourlyRate"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              defaultValue={defaultValues?.defaultHourlyRate ?? tutorDefaultHourlyRate}
              className={inputClassName}
            />
          </Field>

          <Field
            label="Currency"
            htmlFor="defaultCurrency"
            errors={state.fieldErrors?.defaultCurrency}
          >
            <Select
              id="defaultCurrency"
              name="defaultCurrency"
              value={defaultCurrency}
              onChange={setDefaultCurrency}
              options={CURRENCIES.map((code) => ({ value: code, label: code }))}
            />
          </Field>
        </div>
      )}

      <div className="pt-2">
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      </div>
    </form>
  );
}
