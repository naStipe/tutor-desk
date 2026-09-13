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
