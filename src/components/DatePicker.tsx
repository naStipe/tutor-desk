"use client";

import { animate } from "motion";
import { useEffect, useRef, useState } from "react";
import { MonthCalendar } from "../features/lessons/components/MonthCalendar";
import { parseDateParam, startOfDay } from "../features/lessons/date-utils";
import { prefersReducedMotion, SPRING_POP } from "../lib/motion";
import { CalendarIcon, XIcon } from "./icons";

type DatePickerProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  clearable?: boolean;
  className?: string;
  locale?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

function formatLabel(dateParam: string, locale: string) {
  return parseDateParam(dateParam).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DatePicker({
  id,
  name,
  value,
  defaultValue,
  onChange,
  placeholder = "Select a date",
  minDate,
  maxDate,
  clearable = true,
  className,
  locale = "en-US",
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = isControlled ? (value ?? "") : internal;

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() =>
    startOfDay(current ? parseDateParam(current) : new Date()),
  );

  const rootRef = useRef<HTMLDivElement>(null);

  function commit(nextValue: string) {
    if (!isControlled) setInternal(nextValue);
    onChange?.(nextValue);
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={current} />}
      <div className="relative">
        <button
          type="button"
          id={id}
          aria-invalid={ariaInvalid || undefined}
          aria-describedby={ariaDescribedBy}
          onClick={() => {
            if (!open) setMonth(startOfDay(current ? parseDateParam(current) : new Date()));
            setOpen((prev) => !prev);
          }}
          className={
            className ??
            `flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-border-strong focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-brand/25 ${clearable && current ? "pr-8" : ""}`
          }
        >
          <span className={`flex items-center gap-2 truncate ${current ? "" : "text-ink-subtle"}`}>
            <CalendarIcon className="h-4 w-4 shrink-0 text-ink-subtle" />
            {current ? formatLabel(current, locale) : placeholder}
          </span>
        </button>
        {clearable && current && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => commit("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-subtle hover:bg-surface-muted hover:text-ink"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          ref={(el) => {
            if (el && !prefersReducedMotion())
              animate(el, { opacity: [0, 1], scale: [0.96, 1], y: [-4, 0] }, SPRING_POP);
          }}
          className="absolute z-50 mt-1 w-72 origin-top rounded-lg border border-border bg-surface p-2 shadow-lg shadow-black/10"
        >
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            selectedDate={current || null}
            onSelectDate={(dateParam) => {
              commit(dateParam);
              setOpen(false);
            }}
            countByDate={{}}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}
    </div>
  );
}
