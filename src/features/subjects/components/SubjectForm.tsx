"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import type { SubjectActionState } from "../actions";

const initialState: SubjectActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding…" : "Add subject"}
    </Button>
  );
}

export function SubjectForm({
  action,
}: {
  action: (state: SubjectActionState, formData: FormData) => Promise<SubjectActionState>;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state !== initialState && !state.error && !state.fieldErrors) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-3" noValidate>
      <div className="flex-1">
        <Field label="Subject name" htmlFor="name" errors={state.fieldErrors?.name}>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="e.g. Mathematics"
            className={inputClassName}
          />
        </Field>
      </div>
      <SubmitButton />
    </form>
  );
}
