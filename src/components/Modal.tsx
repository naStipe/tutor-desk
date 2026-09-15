"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { XIcon } from "./icons";

/**
 * A modal built on the native <dialog> element: showModal()/close() give us a focus trap, Esc-
 * to-close, background scroll lock, and top-layer stacking for free, instead of reimplementing
 * them with a plain positioned <div>.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: onClick only detects a backdrop click (target === the dialog itself); <dialog> already has native Esc handling for the keyboard case.
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        // A click that lands on the <dialog> element itself (not a descendant) means it hit the
        // backdrop, since the dialog's own box is sized to its content.
        if (event.target === dialogRef.current) onClose();
      }}
      className={`td-modal-pop m-auto max-h-[90vh] w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface p-0 text-ink shadow-lg backdrop:bg-black/30 backdrop:backdrop-blur-[2px] ${className}`}
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </dialog>
  );
}
