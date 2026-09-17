"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar } from "../../../components/Avatar";
import { Button } from "../../../components/Button";
import { Field, inputClassName } from "../../../components/Field";

export type DiscussionActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type DiscussionComment = {
  id: string;
  authorRole: "tutor" | "learner" | "guardian" | "payer";
  body: string;
  createdAt: string;
  isSelf: boolean;
};

const ROLE_LABELS: Record<DiscussionComment["authorRole"], string> = {
  tutor: "Tutor",
  learner: "Student",
  guardian: "Guardian",
  payer: "Payer",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="secondary">
      {pending ? "Posting…" : "Post"}
    </Button>
  );
}

/** Comment thread on a single homework item — shared by the tutor dashboard and student portal. */
export function HomeworkDiscussionThread({
  homeworkId,
  comments,
  action,
  locale,
}: {
  homeworkId: string;
  comments: DiscussionComment[];
  action: (state: DiscussionActionState, formData: FormData) => Promise<DiscussionActionState>;
  locale: string;
}) {
  const [state, formAction] = useActionState(action, {} as DiscussionActionState);

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-ink-subtle">No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-3">
              <Avatar name={ROLE_LABELS[comment.authorRole]} size="sm" />
              <div className="min-w-0 flex-1 rounded-lg bg-surface-muted px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink">
                    {comment.isSelf ? "You" : ROLE_LABELS[comment.authorRole]}
                  </span>
                  <span className="text-xs text-ink-subtle">
                    {new Date(comment.createdAt).toLocaleString(locale, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-muted">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-3" noValidate>
        <input type="hidden" name="homeworkId" value={homeworkId} />
        {state.error && (
          <p
            role="alert"
            className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
          >
            {state.error}
          </p>
        )}
        <Field label="Add a message" htmlFor={`body-${homeworkId}`} errors={state.fieldErrors?.body}>
          <textarea id={`body-${homeworkId}`} name="body" rows={2} className={inputClassName} />
        </Field>
        <SubmitButton />
      </form>
    </div>
  );
}
