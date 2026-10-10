"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { bulkSetLessonPaymentAction, bulkSetLessonPaymentForFilterAction } from "../actions";
import { Button, LinkButton } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { PageHeader } from "../../../components/PageHeader";
import { Select } from "../../../components/Select";
import { bulkAllMatchingMessage, canOfferAllMatching, listSelectionKey } from "../bulk-selection";
import type { LessonListSortKey } from "../data";
import { formatFullDateTime } from "../date-utils";
import type { LessonStatus, PaymentFilter, PaymentStatus } from "../schemas";
import { PaymentBadge } from "./PaymentBadge";
import { StatusBadge } from "./StatusBadge";

export type ListLesson = {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string | null;
  subjectName: string | null;
  startTime: string;
  status: LessonStatus;
  paymentStatus: string;
  price: number | null;
  currency: string | null;
};

const STATUS_FILTERS: { value: LessonStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-show" },
];

const PAYMENT_FILTERS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "All payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "date:desc", label: "Newest first" },
  { value: "date:asc", label: "Oldest first" },
  { value: "student:asc", label: "Student A–Z" },
  { value: "subject:asc", label: "Subject A–Z" },
  { value: "status:asc", label: "Status" },
];

const selectClass =
  "flex w-full sm:w-auto items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition-[border-color,transform] duration-100 hover:border-border-strong focus:border-brand focus:outline-2 focus:outline-offset-1 focus:outline-brand/25 active:scale-[0.98] motion-reduce:active:scale-100";

export function LessonsListView({
  lessons,
  students,
  subjects,
  hasStudents,
  statusFilter,
  studentFilter,
  subjectFilter,
  paymentFilter,
  sortKey,
  sortDir,
  page,
  pageSize,
  totalCount,
  timeZone,
  locale,
}: {
  lessons: ListLesson[];
  students: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  hasStudents: boolean;
  statusFilter: LessonStatus | "all";
  studentFilter: string;
  subjectFilter: string;
  paymentFilter: PaymentFilter;
  sortKey: LessonListSortKey;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
  totalCount: number;
  timeZone?: string;
  locale?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isBulkPending, startBulkTransition] = useTransition();
  // "All N matching" mode, tied to the exact filtered list it was chosen on (see listSelectionKey).
  const [allMatching, setAllMatching] = useState<{ key: string; count: number } | null>(null);
  // Kept after closing so the modal text does not blank out during its exit animation.
  const [confirmTarget, setConfirmTarget] = useState<PaymentStatus>("paid");
  const [confirmCount, setConfirmCount] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const listKey = listSelectionKey({
    status: statusFilter,
    student: studentFilter,
    subject: subjectFilter,
    payment: paymentFilter,
    sortKey,
    sortDir,
    pageSize,
  });
  const allMatchingCount = allMatching && allMatching.key === listKey ? allMatching.count : null;

  const visibleIds = lessons.map((lesson) => lesson.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const selectedOnPage = visibleIds.filter((id) => selectedIds.has(id)).length;
  const offerAllMatching =
    allMatchingCount === null && canOfferAllMatching(selectedOnPage, visibleIds.length, totalCount);
  const hasSelection = selectedIds.size > 0 || allMatchingCount !== null;

  function openConfirm(paymentStatus: PaymentStatus) {
    setConfirmTarget(paymentStatus);
    setConfirmCount(allMatchingCount ?? 0);
    setConfirmOpen(true);
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setAllMatching(null);
    setConfirmOpen(false);
  }

  function toggleSelectAll() {
    setAllMatching(null);
    setSelectedIds(allVisibleSelected ? new Set() : new Set(visibleIds));
  }

  function toggleSelectOne(id: string) {
    setAllMatching(null);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyBulkPayment(paymentStatus: PaymentStatus) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkMessage(null);
    setBulkError(null);
    startBulkTransition(async () => {
      let result: Awaited<ReturnType<typeof bulkSetLessonPaymentAction>>;
      try {
        result = await bulkSetLessonPaymentAction(ids, paymentStatus);
      } catch {
        // Thrown (network, expired session, database): keep the selection so the user can retry.
        setBulkError("Couldn't update the lessons. Your selection is kept. Try again.");
        return;
      }
      if (result.error) {
        setBulkError(result.error);
        return;
      }
      const count = result.updatedCount ?? 0;
      setBulkMessage(
        count === 1
          ? `1 lesson marked ${paymentStatus}.`
          : `${count} lessons marked ${paymentStatus}.`,
      );
      // Clear selection here rather than reacting to the `lessons` prop changing: a bulk update
      // often makes some selected lessons drop out of the current filter (e.g. marking paid while
      // viewing payment=unpaid) so their ids shouldn't linger as "selected" once the list refreshes.
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  function applyBulkPaymentToAllMatching(paymentStatus: PaymentStatus) {
    if (allMatchingCount === null) return;
    const expectedCount = allMatchingCount;
    setConfirmOpen(false);
    setBulkMessage(null);
    setBulkError(null);
    startBulkTransition(async () => {
      let result: Awaited<ReturnType<typeof bulkSetLessonPaymentForFilterAction>>;
      try {
        result = await bulkSetLessonPaymentForFilterAction(
          {
            status: statusFilter === "all" ? undefined : statusFilter,
            student: studentFilter === "all" ? undefined : studentFilter,
            subject: subjectFilter === "all" ? undefined : subjectFilter,
            payment: paymentFilter === "all" ? undefined : paymentFilter,
          },
          paymentStatus,
          expectedCount,
        );
      } catch {
        // Keep the selection so the user can retry.
        setBulkError("Couldn't update the lessons. Your selection is kept. Try again.");
        return;
      }
      if (result.error) {
        setBulkError(result.error);
        return;
      }
      setBulkMessage(
        bulkAllMatchingMessage(result.updatedCount ?? 0, result.matchedCount ?? 0, paymentStatus),
      );
      clearSelection();
      router.refresh();
    });
  }

  function pushParams(updates: Record<string, string | null>) {
    setSelectedIds(new Set());
    setAllMatching(null);
    setConfirmOpen(false);
    setBulkMessage(null);
    setBulkError(null);
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "all") next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in updates)) next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  function toggleSort(key: LessonListSortKey) {
    if (key === sortKey) {
      pushParams({ dir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      pushParams({ sort: key, dir: key === "date" ? "desc" : "asc" });
    }
  }

  const sortHeaderClass = (key: LessonListSortKey) =>
    `flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide transition-colors ${
      sortKey === key ? "text-ink" : "text-ink-subtle hover:text-ink"
    }`;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lessons"
        description="Every lesson, filterable and sortable."
        actions={
          hasStudents ? (
            <LinkButton href="/dashboard/schedule?create=1">Schedule lesson</LinkButton>
          ) : (
            <LinkButton href="/dashboard/students/new">Add student first</LinkButton>
          )
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Select
          value={statusFilter}
          onChange={(value) => pushParams({ status: value })}
          className={selectClass}
          options={STATUS_FILTERS}
        />
        <Select
          value={studentFilter}
          onChange={(value) => pushParams({ student: value })}
          className={selectClass}
          options={[
            { value: "all", label: "All students" },
            ...students.map((student) => ({ value: student.id, label: student.name })),
          ]}
        />
        <Select
          value={subjectFilter}
          onChange={(value) => pushParams({ subject: value })}
          className={selectClass}
          options={[
            { value: "all", label: "All subjects" },
            ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
          ]}
        />
        <Select
          value={paymentFilter}
          onChange={(value) => pushParams({ payment: value })}
          className={selectClass}
          options={PAYMENT_FILTERS}
        />
        {/* The table's sortable column headers don't exist in the phone card list. */}
        <div className="col-span-2 md:hidden">
          <Select
            value={`${sortKey}:${sortDir}`}
            onChange={(value) => {
              const [key, dir] = value.split(":");
              pushParams({ sort: key, dir });
            }}
            className={selectClass}
            options={SORT_OPTIONS}
            aria-label="Sort lessons"
          />
        </div>
      </div>

      {hasSelection && (
        <Card className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 flex flex-wrap items-center justify-between gap-3 bg-surface-muted shadow-lg lg:static lg:shadow-sm">
          <div className="min-w-0 text-sm text-ink">
            <span className="font-medium">
              {allMatchingCount !== null
                ? `All ${allMatchingCount} matching lessons selected`
                : `${selectedIds.size} lesson${selectedIds.size === 1 ? "" : "s"} selected`}
            </span>
            {offerAllMatching && (
              <p className="mt-1 text-ink-muted">
                All {selectedOnPage} lessons on this page are selected.{" "}
                <button
                  type="button"
                  onClick={() => setAllMatching({ key: listKey, count: totalCount })}
                  className="inline-flex min-h-11 items-center font-medium text-brand underline underline-offset-2 md:min-h-0"
                >
                  Select all {totalCount} matching
                </button>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              disabled={isBulkPending}
              onClick={() =>
                allMatchingCount !== null ? openConfirm("paid") : applyBulkPayment("paid")
              }
            >
              {isBulkPending ? "Updating…" : "Mark as paid"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isBulkPending}
              onClick={() =>
                allMatchingCount !== null ? openConfirm("unpaid") : applyBulkPayment("unpaid")
              }
            >
              {isBulkPending ? "Updating…" : "Mark as unpaid"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isBulkPending}
              onClick={clearSelection}
            >
              Clear selection
            </Button>
          </div>
        </Card>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={`Mark ${confirmCount} lessons ${confirmTarget}?`}
        message={`This updates all ${confirmCount} lessons that match the current filters, including those on other pages. Lessons already ${confirmTarget} are left as they are.`}
        confirmLabel={`Mark ${confirmCount} ${confirmTarget}`}
        onConfirm={() => applyBulkPaymentToAllMatching(confirmTarget)}
        onCancel={() => setConfirmOpen(false)}
        disabled={isBulkPending}
      />

      {bulkError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger"
        >
          {bulkError}
        </div>
      )}
      {bulkMessage && (
        <p role="status" className="text-sm text-ink-muted">
          {bulkMessage}
        </p>
      )}

      {lessons.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No lessons match these filters.</p>
        </Card>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            <label className="flex min-h-11 items-center gap-3 px-1 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                className="h-5 w-5 rounded border-border-strong text-brand focus:outline-brand/25"
              />
              Select all on this page
            </label>
            <ul className="space-y-2">
              {lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className={`flex items-start gap-1 rounded-xl border bg-surface p-1 pr-3 ${
                    selectedIds.has(lesson.id) ? "border-brand/50 bg-brand/5" : "border-border"
                  }`}
                >
                  <label className="flex h-11 w-11 shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      aria-label={`Select lesson on ${formatFullDateTime(lesson.startTime, timeZone, locale)}`}
                      checked={selectedIds.has(lesson.id)}
                      onChange={() => toggleSelectOne(lesson.id)}
                      className="h-5 w-5 rounded border-border-strong text-brand focus:outline-brand/25"
                    />
                  </label>
                  <Link
                    href={`/dashboard/lessons/${lesson.id}`}
                    className="min-w-0 flex-1 py-2.5 active:opacity-70"
                  >
                    <p className="text-sm font-medium text-ink">
                      {formatFullDateTime(lesson.startTime, timeZone, locale)}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-ink-muted">
                      {lesson.studentName}
                      {lesson.subjectName ? ` · ${lesson.subjectName}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={lesson.status} />
                      <PaymentBadge status={lesson.paymentStatus} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all visible lessons"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border-strong text-brand focus:outline-brand/25"
                    />
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("date")}
                      className={sortHeaderClass("date")}
                    >
                      Date {sortKey === "date" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("student")}
                      className={sortHeaderClass("student")}
                    >
                      Student {sortKey === "student" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("subject")}
                      className={sortHeaderClass("subject")}
                    >
                      Subject {sortKey === "subject" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort("status")}
                      className={sortHeaderClass("status")}
                    >
                      Status {sortKey === "status" && (sortDir === "asc" ? "↑" : "↓")}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson, index) => (
                  <tr
                    key={lesson.id}
                    className="animate-td-row-in border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted"
                    style={{ animationDelay: `${Math.min(index, 20) * 15}ms` }}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select lesson on ${formatFullDateTime(lesson.startTime, timeZone, locale)}`}
                        checked={selectedIds.has(lesson.id)}
                        onChange={() => toggleSelectOne(lesson.id)}
                        className="h-4 w-4 rounded border-border-strong text-brand focus:outline-brand/25"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/lessons/${lesson.id}`}
                        className="text-ink hover:underline"
                      >
                        {formatFullDateTime(lesson.startTime, timeZone, locale)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{lesson.studentName}</td>
                    <td className="px-4 py-3 text-ink-muted">{lesson.subjectName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lesson.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={lesson.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>
                Page {page} of {totalPages} · {totalCount} lessons
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => pushParams({ page: String(page - 1) })}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => pushParams({ page: String(page + 1) })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
