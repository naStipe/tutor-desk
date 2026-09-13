"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { inputClassName } from "../../../components/Field";
import type { RateActionState } from "../actions";
import { CURRENCIES } from "../schemas";

const initialState: RateActionState = {};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="shrink-0">
      {pending ? pendingLabel : label}
    </Button>
  );
}

type RateFormProps = {
  action: (state: RateActionState, formData: FormData) => Promise<RateActionState>;
  studentId: string;
  subjectOptions?: { id: string; name: string }[];
  fixedSubjectId?: string;
  defaultValues?: { hourlyRate: string; currency: string };
  submitLabel: string;
  pendingLabel: string;
};

export function RateForm({
  action,
  studentId,
  subjectOptions,
  fixedSubjectId,
  defaultValues,
  submitLabel,
  pendingLabel,
}: RateFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-2" noValidate>
      <input type="hidden" name="studentId" value={studentId} />
      {fixedSubjectId && <input type="hidden" name="subjectId" value={fixedSubjectId} />}

      {state.error && <p className="text-xs text-danger">{state.error}</p>}

      <div className="flex flex-wrap items-end gap-2">
        {subjectOptions && (
          <select
            name="subjectId"
            defaultValue={subjectOptions[0]?.id ?? ""}
            className={inputClassName}
          >
            {subjectOptions.length === 0 && (
              <option value="" disabled>
                No subjects left
              </option>
            )}
            {subjectOptions.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        )}

        <input
          name="hourlyRate"
          type="number"
          min="0"
          step="0.01"
          placeholder="Hourly rate"
          defaultValue={defaultValues?.hourlyRate}
          className={`${inputClassName} w-32`}
        />

        <select
          name="currency"
          defaultValue={defaultValues?.currency ?? "RUB"}
          className={`${inputClassName} w-24`}
        >
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>

        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      </div>

      {(state.fieldErrors?.subjectId ?? state.fieldErrors?.hourlyRate) && (
        <p className="text-xs text-danger">
          {state.fieldErrors?.subjectId?.[0] ?? state.fieldErrors?.hourlyRate?.[0]}
        </p>
      )}
    </form>
  );
}
