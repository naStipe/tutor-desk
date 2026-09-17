"use client";

import type { FormEvent, ReactNode } from "react";
import { Button, type ButtonVariant } from "./Button";

/** A server-action form that asks for confirmation before submitting an irreversible action. */
export function ConfirmSubmitForm({
  action,
  confirmMessage,
  label,
  variant = "danger",
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  label: string;
  variant?: ButtonVariant;
  className?: string;
  children?: ReactNode;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmMessage)) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={handleSubmit} className={className}>
      {children}
      <Button type="submit" variant={variant}>
        {label}
      </Button>
    </form>
  );
}
