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
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-brand/25";

export function Field({ label, htmlFor, required, errors, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {hint && !errors?.length && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
      {errors?.map((error) => (
        <p key={error} className="mt-1 text-xs text-danger">
          {error}
        </p>
      ))}
    </div>
  );
}
