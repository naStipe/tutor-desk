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
    </div>
  );
}
