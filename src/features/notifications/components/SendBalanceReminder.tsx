"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "../../../components/Button";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { type BalanceReminderState, sendBalanceReminderAction } from "../actions";

const initialState: BalanceReminderState = {};

export function SendBalanceReminder({
  studentId,
  recipientHint,
}: {
  studentId: string;
  /** Masked address shown in the confirmation, e.g. "p***@example.com". */
  recipientHint: string;
}) {
  const [state, formAction, isPending] = useActionState(sendBalanceReminderAction, initialState);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-3 space-y-2">
      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className="rounded-lg border border-brand/25 bg-brand/10 p-3 text-sm text-brand"
        >
          {state.message}
        </p>
      )}
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="studentId" value={studentId} />
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => setOpen(true)}
        >
          {isPending ? "Sending…" : "Email payment reminder"}
        </Button>
      </form>
      <ConfirmModal
        open={open}
        title="Send payment reminder?"
        message={`This emails the amount owed and your payment instructions to ${recipientHint}.`}
        confirmLabel="Send reminder"
        cancelLabel="Cancel"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </div>
  );
}
