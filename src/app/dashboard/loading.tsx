export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 animate-pulse rounded-md bg-surface-muted" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-surface-muted" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-surface-muted" />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-6 shadow-sm shadow-black/[0.03]">
        {Array.from({ length: 4 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows, no identity to key on
          <div key={index} className="h-14 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
    </div>
  );
}
