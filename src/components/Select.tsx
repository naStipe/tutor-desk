"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";

export type SelectOption = { value: string; label: string; disabled?: boolean };

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
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  const selected = options.find((option) => option.value === current);

  function commit(nextValue: string) {
    if (!isControlled) setInternal(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

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
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={current} />}
      <button
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
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
        className={
          className ??
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-border-strong focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-brand/25 disabled:cursor-not-allowed disabled:opacity-50"
        }
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
          className="td-modal-pop absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface p-1 shadow-lg shadow-black/10"
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
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm ${
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
