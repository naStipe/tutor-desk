"use client";

import type { FormEvent } from "react";
import { Button } from "../../../components/Button";

type ConfirmDeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  from?: string;
  confirmMessage: string;
  label: string;
  className?: string;
};

export function ConfirmDeleteForm({
  action,
  id,
  from,
  confirmMessage,
  label,
  className,
}: ConfirmDeleteFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmMessage)) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={handleSubmit} className={className}>
      <input type="hidden" name="id" value={id} />
      {from && <input type="hidden" name="from" value={from} />}
      <Button type="submit" variant="danger">
        {label}
      </Button>
    </form>
  );
}
