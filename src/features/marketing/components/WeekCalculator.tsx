"use client";

import { useState } from "react";
import { monthlyIncome, weeklyAdminHours } from "../week-math";

const FIELDS = [
  { key: "lessonsPerWeek", label: "Lessons per week", min: 2, max: 40, step: 1, suffix: "" },
  { key: "ratePerLesson", label: "Rate per lesson", min: 10, max: 150, step: 5, suffix: "" },
  {
    key: "adminMinutes",
    label: "Admin minutes per lesson",
    min: 0,
    max: 30,
    step: 1,
    suffix: " min",
  },
] as const;

// The visitor's own estimate. Nothing is stored or sent.
export function WeekCalculator() {
  const [input, setInput] = useState({ lessonsPerWeek: 12, ratePerLesson: 40, adminMinutes: 10 });

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div className="space-y-6 text-left">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={`calc-${field.key}`}
              className="flex justify-between text-sm font-semibold text-ink"
            >
              <span>{field.label}</span>
              <span className="font-mono text-brand">
                {field.key === "ratePerLesson" ? "$" : ""}
                {input[field.key]}
                {field.suffix}
              </span>
            </label>
            <input
              id={`calc-${field.key}`}
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={input[field.key]}
              onChange={(event) => setInput({ ...input, [field.key]: Number(event.target.value) })}
              className="td-range mt-2 w-full"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col justify-center gap-4 text-left">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-subtle">
            Business you run each month
          </p>
          <p className="td-gradient-text mt-2 text-5xl font-bold tracking-tight" aria-live="polite">
            ${monthlyIncome(input).toLocaleString("en-US")}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-subtle">
            Admin hours in your week
          </p>
          <p className="mt-2 text-5xl font-bold tracking-tight text-ink" aria-live="polite">
            {weeklyAdminHours(input)} h
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Time you could spend teaching, resting or taking one more student.
          </p>
        </div>
      </div>
    </div>
  );
}
