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
  defaultValues?: { name: string; email: string; notes: string };
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
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
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

      <Field label="Notes" htmlFor="notes" errors={state.fieldErrors?.notes}>
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
