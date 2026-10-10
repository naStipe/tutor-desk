"use client";

import { animate } from "motion";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { prefersReducedMotion, SPRING_SETTLE } from "../lib/motion";
import { XIcon } from "./icons";

/** Below Tailwind's `sm` breakpoint the modal docks to the bottom edge as a sheet. */
const SHEET_QUERY = "(max-width: 639px)";

function isSheetLayout() {
  return window.matchMedia(SHEET_QUERY).matches;
}

/**
 * A modal built on the native <dialog> element: showModal()/close() give us a focus trap, Esc-
 * to-close, background scroll lock, and top-layer stacking for free, instead of reimplementing
 * them with a plain positioned <div>. On phones it renders as a bottom sheet (thumb-reachable,
 * full width, keyboard- and notch-aware) rather than a small centered card.
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
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      if (prefersReducedMotion()) return;
      animate(
        dialog,
        isSheetLayout() ? { opacity: [0, 1], y: [48, 0] } : { opacity: [0, 1], scale: [0.96, 1] },
        SPRING_SETTLE,
      );
      return;
    }

    if (!open && dialog.open) {
      if (prefersReducedMotion()) {
        dialog.close();
        return;
      }
      const controls = animate(
        dialog,
        isSheetLayout() ? { opacity: [1, 0], y: [0, 48] } : { opacity: [1, 0], scale: [1, 0.97] },
        SPRING_SETTLE,
      );
      controls.then(() => dialog.close());
      return () => controls.stop();
    }
  }, [open]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: onClick only detects a backdrop click (target === the dialog itself); <dialog> already has native Esc handling for the keyboard case.
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click that lands on the <dialog> element itself (not a descendant) means it hit the
        // backdrop, since the dialog's own box is sized to its content.
        if (event.target === dialogRef.current) onClose();
      }}
      className={`m-auto max-h-[90dvh] w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface p-0 text-ink shadow-lg backdrop:bg-black/30 backdrop:backdrop-blur-[2px] max-sm:mb-0 max-sm:mt-auto max-sm:max-h-[92dvh] max-sm:max-w-none max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0 ${className}`}
    >
      <div className="flex max-h-[90dvh] flex-col max-sm:max-h-[92dvh]">
        <div
          aria-hidden="true"
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong sm:hidden"
        />
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3 sm:py-3.5">
          <h3 id={titleId} className="text-base font-semibold text-ink sm:text-sm">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-my-1 -mr-3 rounded-full p-3 text-ink-subtle transition-[background-color,color,transform] duration-100 hover:bg-surface-muted hover:text-ink active:scale-90 motion-reduce:active:scale-100 sm:-mr-1 sm:p-1.5"
          >
            <XIcon className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-5 max-sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </dialog>
  );
}
