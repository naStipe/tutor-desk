"use client";

import { useState } from "react";

const TOOLS = [
  { name: "Calendar app", pain: "Reschedules get lost in the thread." },
  { name: "Spreadsheet", pain: "Hours and rates typed by hand." },
  { name: "Chat apps", pain: "Reminders buried under other messages." },
  { name: "Notes and drive", pain: "Where did that worksheet go?" },
  { name: "Bank app", pain: "Chasing payments, awkwardly." },
];

const BENEFITS = [
  {
    title: "One calendar",
    text: "Lessons and reschedules live next to the student they belong to.",
  },
  { title: "One student record", text: "Notes, homework and payment history in a single profile." },
  {
    title: "One place to get paid",
    text: "See who owes what at a glance and mark lessons paid in bulk.",
  },
];

// Toggles between the scattered-tools view and the single workspace. Both views stay in the DOM
// (the inactive one is hidden with the `hidden` attribute) so the copy is crawlable.
export function Patchwork() {
  const [after, setAfter] = useState(false);

  return (
    <div>
      <fieldset className="mx-auto mt-8 inline-flex rounded-md border border-border bg-surface-muted p-1">
        <legend className="sr-only">Compare</legend>
        {[
          { label: "The patchwork", value: false },
          { label: "With TutorDesk", value: true },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={after === option.value}
            onClick={() => setAfter(option.value)}
            className={`min-h-11 rounded px-5 text-sm font-medium tracking-wide transition-colors duration-300 ${
              after === option.value
                ? "bg-brand-strong text-on-brand"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </fieldset>

      <div className="mt-10 min-h-64">
        <ul hidden={after} className="flex flex-wrap justify-center gap-4">
          {TOOLS.map((tool, index) => (
            <li
              key={tool.name}
              className="td-pop w-44 rounded-lg border border-border-strong bg-surface p-5 text-left sm:w-48"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <strong className="block text-base text-ink">{tool.name}</strong>
              <span className="mt-1.5 block text-sm leading-snug text-ink-muted">{tool.pain}</span>
            </li>
          ))}
        </ul>
        <div hidden={!after} className="mx-auto grid max-w-3xl gap-4 text-left md:grid-cols-3">
          {BENEFITS.map((benefit, index) => (
            <div
              key={benefit.title}
              className="td-pop rounded-lg border border-brand bg-surface p-5"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <strong className="block text-base text-ink">{benefit.title}</strong>
              <span className="mt-1.5 block text-sm leading-snug text-ink-muted">
                {benefit.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
