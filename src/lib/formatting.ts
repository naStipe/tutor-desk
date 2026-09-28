const DEFAULT_LOCALE = "en-US";

/** Formats a numeric(10,2) amount as currency, honoring the currency's own decimal convention. */
export function formatMoney(amount: number, currency: string, locale = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

/**
 * "1 day overdue", "3 days overdue" — for a due date already in the past. Shared by the tutor
 * dashboard's "Needs review" card and the student portal's due-date nudge banner.
 */
export function formatOverdue(now: Date, iso: string) {
  const due = new Date(iso);
  const days = Math.max(1, Math.ceil((now.getTime() - due.getTime()) / 86400000));
  return days === 1 ? "1 day overdue" : `${days} days overdue`;
}

/** "Due today", "Due tomorrow", "Due in 3 days" — for a due date coming up soon. */
export function formatDueSoon(now: Date, iso: string) {
  const due = new Date(iso);
  const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  if (days <= 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
