"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field } from "../../../components/Field";
import { Select } from "../../../components/Select";
import type { PackageActionState } from "../actions";

const initialState: PackageActionState = {};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Adding…" : "Add to student"}
    </Button>
  );
}

export function ApplyTemplateForm({
  action,
  studentId,
  options,
}: {
  action: (state: PackageActionState, formData: FormData) => Promise<PackageActionState>;
  studentId: string;
  options: { value: string; label: string }[];
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [templateId, setTemplateId] = useState("");

  return (
    <form action={formAction} className="space-y-3" noValidate>
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
      <Field label="Add one of your packages" htmlFor="templateId">
        <Select
          id="templateId"
          name="templateId"
          value={templateId}
          onChange={setTemplateId}
          placeholder="Choose a package"
          options={options}
        />
      </Field>
      <SubmitButton disabled={templateId === ""} />
    </form>
  );
}
