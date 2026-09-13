"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
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

type StudentFormProps = {
  action: (state: StudentActionState, formData: FormData) => Promise<StudentActionState>;
  studentId?: string;
  defaultValues?: { name: string; email: string; phone: string; telegram: string; notes: string };
  submitLabel: string;
  pendingLabel: string;
};

export function StudentForm({
  action,
  studentId,
  defaultValues,
  submitLabel,
  pendingLabel,
}: StudentFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {studentId && <input type="hidden" name="id" value={studentId} />}

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

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

      <div className="space-y-4 rounded-lg border border-border p-3">
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

      <Field label="Note" htmlFor="notes" errors={state.fieldErrors?.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={4}
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
