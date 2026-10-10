"use client";

import { animate } from "motion";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { prefersReducedMotion, SPRING_POP } from "../lib/motion";
import { CheckIcon, ChevronDownIcon } from "./icons";

export type SelectOption = { value: string; label: string; disabled?: boolean };

const COARSE_POINTER_QUERY = "(pointer: coarse)";

function subscribeCoarsePointer(onChange: () => void) {
  const query = window.matchMedia(COARSE_POINTER_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True on touch-first devices (phones/tablets), where the OS's own picker beats a custom popover. */
function useCoarsePointer() {
  return useSyncExternalStore(
    subscribeCoarsePointer,
    () => window.matchMedia(COARSE_POINTER_QUERY).matches,
    () => false,
  );
}

const DEFAULT_TRIGGER_CLASS =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-border-strong focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-brand/25 disabled:cursor-not-allowed disabled:opacity-50";

type SelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function Select({
  id,
  name,
  value,
  defaultValue,
  onChange,
  options,
  placeholder,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: SelectProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = isControlled ? (value ?? "") : internal;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const reactId = useId();
  const triggerId = id ?? reactId;
  const listId = `${triggerId}-listbox`;

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  const selected = options.find((option) => option.value === current);
  const coarsePointer = useCoarsePointer();

  function commit(nextValue: string) {
    if (!isControlled) setInternal(nextValue);
    onChange?.(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // React ignores `autoFocus` on a <div>, so hand keyboard control to the listbox explicitly;
  // otherwise ArrowUp/Down/Enter keep going to the trigger and an option can never be chosen.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  useEffect(() => {
    if (open && listRef.current && !prefersReducedMotion()) {
      animate(listRef.current, { opacity: [0, 1], scale: [0.96, 1], y: [-4, 0] }, SPRING_POP);
    }
  }, [open]);

  function openAt(index: number) {
    setOpen(true);
    setActiveIndex(index);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    if (disabled) return;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const currentIndex = options.findIndex((option) => option.value === current);
        openAt(currentIndex >= 0 ? currentIndex : 0);
        break;
      }
      case "Enter":
      case " ":
        event.preventDefault();
        openAt(
          Math.max(
            0,
            options.findIndex((option) => option.value === current),
          ),
        );
        break;
      case "Escape":
        setOpen(false);
        break;
      default:
        break;
    }
  }

  function handleListKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => Math.min(options.length - 1, index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ": {
        event.preventDefault();
        const option = options[activeIndex];
        if (option && !option.disabled) commit(option.value);
        break;
      }
      case "Escape":
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  }

  if (coarsePointer) {
    // Touch devices get the platform's own picker: a custom popover inside a scrolling modal is
    // clipped, closes when the page is scrolled, and has tap targets far below 44px. Font size is
    // pinned to 16px so iOS Safari doesn't zoom the page on focus.
    return (
      <div className="relative">
        <select
          id={triggerId}
          name={name}
          value={current}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid || undefined}
          aria-describedby={ariaDescribedBy}
          onChange={(event) => commit(event.target.value)}
          style={{ fontSize: 16 }}
          className={`${className ?? DEFAULT_TRIGGER_CLASS} min-h-11 appearance-none pr-9 ${selected ? "" : "text-ink-subtle"}`}
        >
          {!selected && (
            <option value="" disabled>
              {placeholder ?? "Select…"}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={current} />}
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        onClick={() =>
          open
            ? setOpen(false)
            : openAt(
                Math.max(
                  0,
                  options.findIndex((o) => o.value === current),
                ),
              )
        }
        onKeyDown={handleTriggerKeyDown}
        className={className ?? DEFAULT_TRIGGER_CLASS}
      >
        <span className={selected ? "truncate" : "truncate text-ink-subtle"}>
          {selected ? selected.label : (placeholder ?? "Select…")}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-ink-subtle transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          onKeyDown={handleListKeyDown}
          // biome-ignore lint/a11y/noAutofocus: opening the menu should hand keyboard control to it immediately
          autoFocus
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full origin-top overflow-auto rounded-lg border border-border bg-surface p-1 shadow-lg shadow-black/10"
        >
          {options.map((option, index) => (
            // biome-ignore lint/a11y/useFocusableInteractive: focus stays on the listbox; aria-activedescendant simulates focus per option
            // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard selection is handled by the listbox's onKeyDown
            <div
              key={option.value}
              id={`${listId}-${index}`}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              role="option"
              aria-selected={option.value === current}
              aria-disabled={option.disabled}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => !option.disabled && commit(option.value)}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-transform duration-75 active:scale-[0.97] motion-reduce:active:scale-100 ${
                option.disabled
                  ? "cursor-not-allowed text-ink-subtle"
                  : index === activeIndex
                    ? "bg-surface-muted text-ink"
                    : "text-ink"
              } ${option.value === current && !option.disabled ? "font-medium text-brand" : ""}`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === current && !option.disabled && (
                <CheckIcon className="h-3.5 w-3.5 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
