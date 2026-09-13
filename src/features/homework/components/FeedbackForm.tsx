"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";
import { recordFeedbackAction, type HomeworkActionState } from "../actions";

const initialState: HomeworkActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function FeedbackForm({
  homeworkId,
  defaultValue,
  label,
}: {
  homeworkId: string;
  defaultValue?: string;
  label: string;
}) {
  const [state, formAction] = useActionState(recordFeedbackAction, initialState);

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
        label="Feedback for the student"
        htmlFor="feedbackText"
        errors={state.fieldErrors?.feedbackText}
      >
        <textarea
          id="feedbackText"
          name="feedbackText"
          rows={4}
          defaultValue={defaultValue}
          className={inputClassName}
        />
      </Field>
      <SubmitButton label={label} />
    </form>
  );
}
