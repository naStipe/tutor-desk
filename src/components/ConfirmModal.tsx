"use client";

import { Button } from "./Button";
import { Modal } from "./Modal";

/**
 * Confirmation dialog built on `Modal` (bottom sheet on phones), replacing `window.confirm`.
 * The destructive button is stacked below the cancel button with a clear gap and is at least
 * 44px high, so a thumb tap on one cannot land on the other.
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Go back",
  onConfirm,
  onCancel,
  disabled = false,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-ink-muted">{message}</p>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row-reverse sm:justify-start sm:gap-2">
        <Button
          type="button"
          variant="danger"
          disabled={disabled}
          onClick={onConfirm}
          className="min-h-12 sm:min-h-0"
        >
          {confirmLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="min-h-12 sm:min-h-0"
        >
          {cancelLabel}
        </Button>
      </div>
    </Modal>
  );
}
