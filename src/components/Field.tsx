import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  errors?: string[];
  hint?: string;
  children: ReactNode;
}

export const inputClassName =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-2 focus:outline-offset-1 focus:outline-blue-100";

export function Field({ label, htmlFor, required, errors, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {hint && !errors?.length && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {errors?.map((error) => (
        <p key={error} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      ))}
    </div>
  );
}
