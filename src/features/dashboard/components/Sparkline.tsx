const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function Sparkline({ values, activeIndex }: { values: number[]; activeIndex: number }) {
  const max = Math.max(1, ...values);
  return (
    <div
      className="flex h-[30px] items-end gap-1"
      role="img"
      aria-label="Lessons scheduled per day this week"
    >
      {values.map((value, index) => {
        const heightPct = Math.max(6, Math.round((value / max) * 100));
        const active = index === activeIndex;
        return (
          <span
            key={WEEKDAYS[index]}
            style={{ height: `${heightPct}%` }}
            className={`flex-1 rounded-[3px] ${
              active ? "bg-[var(--td2-bar-active)]" : "bg-[var(--td2-bar-inactive)]"
            }`}
          />
        );
      })}
    </div>
  );
}
