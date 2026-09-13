"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import { recordSubmissionAction, type HomeworkActionState } from "../actions";

const initialState: HomeworkActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="secondary">
      {pending ? "Saving…" : "Record submission"}
    </Button>
  );
}

export function SubmissionForm({ homeworkId }: { homeworkId: string }) {
  const [state, formAction] = useActionState(recordSubmissionAction, initialState);

  return (
    <form action={formAction} className="space-y-3" noValidate>
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
        label="What did the student submit?"
        htmlFor="submissionText"
        errors={state.fieldErrors?.submissionText}
      >
        <textarea id="submissionText" name="submissionText" rows={4} className={inputClassName} />
      </Field>
      <SubmitButton />
    </form>
  );
}
