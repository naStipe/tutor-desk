import { STATUS_DOT_CLASSES, STATUS_LABELS } from "./LessonCalendar";

export function CalendarLegend({ reviewLabel = "ready for review" }: { reviewLabel?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-subtle">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" aria-hidden="true" />
        Homework due
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-cyan/70" aria-hidden="true" />
        {reviewLabel[0].toUpperCase() + reviewLabel.slice(1)}
      </span>
      <span className="mx-1 hidden h-3 w-px bg-border sm:inline-block" aria-hidden="true" />
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-ink-subtle">Status:</span>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <span key={status} className="flex items-center gap-1">
            <span
              className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASSES[status as keyof typeof STATUS_DOT_CLASSES]}`}
              aria-hidden="true"
            />
            {label}
          </span>
        ))}
      </span>
    </div>
  );
}
