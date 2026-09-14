"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { inputClassName } from "../../../components/Field";
import { Select } from "../../../components/Select";
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
  const [subjectId, setSubjectId] = useState(subjectOptions?.[0]?.id ?? "");
  const [currency, setCurrency] = useState(defaultValues?.currency ?? "RUB");

  return (
    <form action={formAction} className="space-y-2" noValidate>
      <input type="hidden" name="studentId" value={studentId} />
      {fixedSubjectId && <input type="hidden" name="subjectId" value={fixedSubjectId} />}

      {state.error && <p className="text-xs text-danger">{state.error}</p>}

      <div className="flex flex-wrap items-end gap-2">
        {subjectOptions && (
          <Select
            name="subjectId"
            value={subjectId}
            onChange={setSubjectId}
            className="flex w-44 items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-border-strong focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-brand/25"
            options={
              subjectOptions.length === 0
                ? [{ value: "", label: "No subjects left", disabled: true }]
                : subjectOptions.map((subject) => ({ value: subject.id, label: subject.name }))
            }
          />
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

        <Select
          name="currency"
          value={currency}
          onChange={setCurrency}
          className="flex w-24 items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-border-strong focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-brand/25"
          options={CURRENCIES.map((code) => ({ value: code, label: code }))}
        />

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
