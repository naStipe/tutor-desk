"use client";

import { type ReactNode, useRef, useState } from "react";
import { Button, type ButtonVariant } from "./Button";
import { ConfirmModal } from "./ConfirmModal";

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
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <form ref={formRef} action={action} className={className}>
        {children}
        <Button type="button" variant={variant} onClick={() => setOpen(true)}>
          {label}
        </Button>
      </form>
      <ConfirmModal
        open={open}
        title="Are you sure?"
        message={confirmMessage}
        confirmLabel={label}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
