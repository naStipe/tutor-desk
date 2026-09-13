"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { inputClassName } from "../../../components/Field";
import type { AuthActionState } from "../actions";

const initialState: AuthActionState = {};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand shadow-sm transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

type AuthFormProps = {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  googleAction: () => Promise<void>;
  heading: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  alternateText: string;
  alternateHref: string;
  alternateLabel: string;
  notice?: string;
};

export function AuthForm(props: AuthFormProps) {
  const [state, formAction] = useActionState(props.action, initialState);

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm shadow-black/[0.03] sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-ink">{props.heading}</h1>
      <p className="mt-1 text-sm text-ink-muted">{props.description}</p>

      {state.error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
      {props.notice && !state.error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-warning/25 bg-warning/10 p-3 text-sm text-warning"
        >
          {props.notice}
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
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={
              props.submitLabel === "Create account" ? "new-password" : "current-password"
            }
            className={inputClassName}
          />
          {state.fieldErrors?.password?.map((error) => (
            <p key={error} className="mt-1 text-xs text-danger">
              {error}
            </p>
          ))}
        </div>
        <SubmitButton label={props.submitLabel} pendingLabel={props.pendingLabel} />
      </form>

      <div className="mt-4 flex items-center gap-3 text-xs text-ink-subtle">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={props.googleAction} className="mt-4">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.89c2.28-2.1 3.53-5.2 3.53-8.8Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-2.98c-1.08.72-2.45 1.15-4.04 1.15-3.11 0-5.75-2.1-6.69-4.92H1.28v3.09C3.25 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.31 14.34c-.25-.72-.38-1.49-.38-2.34s.14-1.62.38-2.34V6.57H1.28C.47 8.16 0 9.98 0 12s.47 3.84 1.28 5.43l4.03-3.09Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.43-3.43C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.57l4.03 3.09C6.25 6.85 8.89 4.75 12 4.75Z"
            />
          </svg>
          Continue with Google
        </button>
      </form>

      <p className="mt-6 border-t border-border pt-5 text-center text-xs text-ink-muted">
        {props.alternateText}{" "}
        <Link
          href={props.alternateHref}
          className="font-medium text-brand underline underline-offset-2"
        >
          {props.alternateLabel}
        </Link>
      </p>
    </div>
  );
}
