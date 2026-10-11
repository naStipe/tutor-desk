"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import { Select } from "../../../components/Select";
import { CURRENCIES } from "../../rates/schemas";
import type { PackageActionState } from "../actions";

const initialState: PackageActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding…" : "Add package"}
    </Button>
  );
}

export function PackageForm({
  action,
  studentId,
  defaultCurrency,
}: {
  action: (state: PackageActionState, formData: FormData) => Promise<PackageActionState>;
  studentId: string;
  defaultCurrency: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [currency, setCurrency] = useState(defaultCurrency);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields after a successful add; the new package shows up in the list above.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="studentId" value={studentId} />

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="rounded-lg border border-brand/25 bg-brand/10 p-3 text-sm text-brand-strong"
        >
          {state.success}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          label="Lessons in package"
          htmlFor="totalLessons"
          required
          errors={state.fieldErrors?.totalLessons}
        >
          <input
            id="totalLessons"
            name="totalLessons"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="10"
            className={inputClassName}
          />
        </Field>
        <Field
          label="Package price"
          htmlFor="packagePrice"
          hint="What the student paid in total"
          errors={state.fieldErrors?.price}
        >
          <input
            id="packagePrice"
            name="price"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className={inputClassName}
          />
        </Field>
        <Field label="Currency" htmlFor="packageCurrency" errors={state.fieldErrors?.currency}>
          <Select
            id="packageCurrency"
            name="currency"
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES.map((code) => ({ value: code, label: code }))}
          />
        </Field>
      </div>

      <Field label="Note" htmlFor="packageNote" errors={state.fieldErrors?.note}>
        <input
          id="packageNote"
          name="note"
          type="text"
          maxLength={500}
          placeholder="e.g. Paid by bank transfer"
          className={inputClassName}
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
