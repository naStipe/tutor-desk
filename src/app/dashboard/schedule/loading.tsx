export default function ScheduleLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse rounded-md bg-surface-muted" />
          <div className="h-4 w-48 animate-pulse rounded-md bg-surface-muted" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-9 w-40 animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder columns, no identity to key on
          <div key={index} className="h-96 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
