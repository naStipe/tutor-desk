import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

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
  const hasErrors = !!errors?.length;
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;
  const describedBy =
    [hasErrors ? errorId : null, !hasErrors && hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  const child = Children.only(children);
  const input = isValidElement(child)
    ? cloneElement(child as ReactElement<Record<string, unknown>>, {
        "aria-invalid": hasErrors || undefined,
        "aria-describedby": describedBy,
      })
    : child;

  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {input}
      {hint && !hasErrors && (
        <p id={hintId} className="mt-1 text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {errors?.map((error, index) => (
        <p
          key={error}
          id={index === 0 ? errorId : undefined}
          role="alert"
          className="mt-1 text-xs text-danger"
        >
          {error}
        </p>
      ))}
    </div>
  );
}
