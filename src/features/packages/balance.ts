export type PackageBalance = {
  total: number;
  /** Lessons reserved for scheduled lessons; released again if the lesson is cancelled. */
  booked: number;
  /** Lessons spent on completed or no-show lessons. */
  used: number;
  remaining: number;
};

/**
 * Balance of one or more packages. `lessonStatuses` are the statuses of the lessons currently
 * covered by those packages. Cancelled lessons never hold credit (the database releases them).
 */
export function computePackageBalance(totals: number[], lessonStatuses: string[]): PackageBalance {
  const total = totals.reduce((sum, value) => sum + value, 0);
  let booked = 0;
  let used = 0;
  for (const status of lessonStatuses) {
    if (status === "scheduled") booked += 1;
    else if (status === "completed" || status === "no_show") used += 1;
  }
  return { total, booked, used, remaining: Math.max(0, total - booked - used) };
}
