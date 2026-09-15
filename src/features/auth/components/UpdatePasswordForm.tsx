"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { inputClassName } from "../../../components/Field";
import { updatePasswordAction, type AuthActionState } from "../actions";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand shadow-sm transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : "Set new password"}
    </button>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm shadow-black/[0.03] sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-ink">Choose a new password</h1>
      <p className="mt-1 text-sm text-ink-muted">
        You're signed in via your reset link. Set a new password below.
      </p>

      {state.error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className={inputClassName}
          />
          {state.fieldErrors?.password?.map((error) => (
            <p key={error} className="mt-1 text-xs text-danger">
              {error}
            </p>
          ))}
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
