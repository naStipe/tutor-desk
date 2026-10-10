import type { PaymentStatus } from "./schemas";

/**
 * Gmail-style "select all N matching" is offered only when every row on the page is selected and
 * the filtered result has more rows than the page.
 */
export function canOfferAllMatching(selectedOnPage: number, pageRows: number, totalCount: number) {
  return pageRows > 0 && selectedOnPage === pageRows && totalCount > pageRows;
}

/** Identity of the filtered list. "All matching" mode is only valid while this key is unchanged. */
export function listSelectionKey(parts: {
  status: string;
  student: string;
  subject: string;
  payment: string;
  sortKey: string;
  sortDir: string;
  pageSize: number;
}) {
  return JSON.stringify([
    parts.status,
    parts.student,
    parts.subject,
    parts.payment,
    parts.sortKey,
    parts.sortDir,
    parts.pageSize,
  ]);
}

export function bulkAllMatchingMessage(
  updatedCount: number,
  matchedCount: number,
  paymentStatus: PaymentStatus,
) {
  const noun = (n: number) => `${n} lesson${n === 1 ? "" : "s"}`;
  const base = `${noun(updatedCount)} marked ${paymentStatus}.`;
  const skipped = matchedCount - updatedCount;
  return skipped > 0 ? `${base} ${skipped} already ${paymentStatus}.` : base;
}
