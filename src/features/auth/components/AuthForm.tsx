"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { AuthActionState } from "../actions";

const initialState: AuthActionState = {};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-slate-900">{props.heading}</h1>
      <p className="mt-1 text-sm text-slate-500">{props.description}</p>

      {state.error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {state.error}
        </p>
      )}
      {props.notice && !state.error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          {props.notice}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          {state.message}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {state.fieldErrors?.email?.map((error) => (
            <p key={error} className="mt-1 text-xs text-rose-600">
              {error}
            </p>
          ))}
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={
              props.submitLabel === "Create account" ? "new-password" : "current-password"
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {state.fieldErrors?.password?.map((error) => (
            <p key={error} className="mt-1 text-xs text-rose-600">
              {error}
            </p>
          ))}
        </div>
        <SubmitButton label={props.submitLabel} pendingLabel={props.pendingLabel} />
      </form>

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={props.googleAction} className="mt-4">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
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

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
        {props.alternateText}{" "}
        <Link
          href={props.alternateHref}
          className="font-medium text-blue-600 underline underline-offset-2"
        >
          {props.alternateLabel}
        </Link>
      </p>
    </div>
  );
}
