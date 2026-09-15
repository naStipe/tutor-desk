export default function LessonsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-6 w-24 animate-pulse rounded-md bg-surface-muted" />
          <div className="h-4 w-56 animate-pulse rounded-md bg-surface-muted" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-lg bg-surface-muted" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder filters, no identity to key on
          <div key={index} className="h-9 w-32 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows, no identity to key on
          <div key={index} className="h-12 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
