"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { inputClassName } from "../../../components/Field";
import { requestPasswordResetAction, type AuthActionState } from "../actions";

const initialState: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand shadow-sm transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export function RequestResetForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm shadow-black/[0.03] sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {state.error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-brand/25 bg-brand/10 p-3 text-sm text-brand"
        >
          {state.message}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
          />
          {state.fieldErrors?.email?.map((error) => (
            <p key={error} className="mt-1 text-xs text-danger">
              {error}
            </p>
          ))}
        </div>
        <SubmitButton />
      </form>

      <p className="mt-6 border-t border-border pt-5 text-center text-xs text-ink-muted">
        Remembered your password?{" "}
        <Link href="/sign-in" className="font-medium text-brand underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
