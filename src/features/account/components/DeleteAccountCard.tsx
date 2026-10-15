"use client";

import { useActionState, useState } from "react";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Field, inputClassName } from "../../../components/Field";
import { type DeleteAccountState, deleteAccountAction } from "../actions";
import { emailsMatch } from "../schemas";

const INITIAL_STATE: DeleteAccountState = {};

/** Settings card. The server re-checks the email; the disabled button is only a convenience. */
export function DeleteAccountCard({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(deleteAccountAction, INITIAL_STATE);
  const [typed, setTyped] = useState("");

  return (
    <Card className="space-y-4 border-danger/30">
      <div>
        <h2 className="text-sm font-semibold text-danger">Delete account</h2>
        <p className="mt-1 text-sm text-ink-muted">
          This permanently deletes your account and everything you entered: students, lessons,
          homework and files, packages and payment records. Student portal access ends. It cannot be
          undone.
        </p>
      </div>

      <form action={formAction} className="space-y-4" autoComplete="off">
        <Field
          label={`Type ${email} to confirm`}
          htmlFor="confirmEmail"
          errors={state.fieldErrors?.confirmEmail}
        >
          <input
            id="confirmEmail"
            name="confirmEmail"
            type="email"
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            className={inputClassName}
          />
        </Field>
        {state.error && (
          <p
            role="alert"
            className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
          >
            {state.error}
          </p>
        )}
        <Button type="submit" variant="danger" disabled={pending || !emailsMatch(typed, email)}>
          {pending ? "Deleting…" : "Delete my account"}
        </Button>
      </form>
    </Card>
  );
}
