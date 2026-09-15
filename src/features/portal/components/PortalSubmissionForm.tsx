"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import { submitHomeworkAction, type PortalActionState } from "../actions";

const initialState: PortalActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="secondary">
      {pending ? "Submitting…" : "Submit"}
    </Button>
  );
}

export function PortalSubmissionForm({ homeworkId }: { homeworkId: string }) {
  const [state, formAction] = useActionState(submitHomeworkAction, initialState);

  return (
    <form action={formAction} className="mt-3 space-y-3" noValidate>
      <input type="hidden" name="id" value={homeworkId} />
      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
      <Field
        label="Your answer"
        htmlFor={`submissionText-${homeworkId}`}
        errors={state.fieldErrors?.submissionText}
      >
        <textarea
          id={`submissionText-${homeworkId}`}
          name="submissionText"
          rows={3}
          className={inputClassName}
        />
      </Field>
      <SubmitButton />
    </form>
  );
}
