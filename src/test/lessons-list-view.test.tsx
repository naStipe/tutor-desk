// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LessonsListView, type ListLesson } from "../features/lessons/components/LessonsListView";
import { installDeviceMedia, polyfillDialog } from "./dom-helpers";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  bulk: vi.fn(),
  bulkForFilter: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  usePathname: () => "/dashboard/lessons",
  useSearchParams: () => new URLSearchParams("status=completed"),
}));

vi.mock("../features/lessons/actions", () => ({
  bulkSetLessonPaymentAction: mocks.bulk,
  bulkSetLessonPaymentForFilterAction: mocks.bulkForFilter,
}));

function makeLessons(count: number): ListLesson[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `lesson-${index + 1}`,
    studentId: "s1",
    studentName: `Student ${index + 1}`,
    subjectId: null,
    subjectName: index % 2 === 0 ? "Math" : null,
    startTime: `2026-10-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
    endTime: `2026-10-${String(index + 1).padStart(2, "0")}T11:00:00.000Z`,
    status: "completed",
    paymentStatus: "unpaid",
    price: 40,
    currency: "USD",
  }));
}

function renderList(
  props: { lessons?: ListLesson[]; totalCount?: number; pageSize?: number } = {},
) {
  const lessons = props.lessons ?? makeLessons(3);
  return render(
    <LessonsListView
      lessons={lessons}
      students={[{ id: "s1", name: "Student 1" }]}
      subjects={[]}
      hasStudents
      statusFilter="completed"
      studentFilter="all"
      subjectFilter="all"
      paymentFilter="unpaid"
      sortKey="date"
      sortDir="desc"
      page={1}
      pageSize={props.pageSize ?? 50}
      totalCount={props.totalCount ?? lessons.length}
      timeZone="UTC"
      locale="en-US"
    />,
  );
}

/** The desktop table and the phone card list both render in jsdom (CSS hides one); use the table. */
function rowCheckboxes() {
  return screen.getAllByRole("checkbox", { name: /^Select lesson on/ });
}

beforeEach(() => {
  mocks.push.mockReset();
  mocks.refresh.mockReset();
  mocks.bulk.mockReset();
  mocks.bulkForFilter.mockReset();
  polyfillDialog();
  installDeviceMedia();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("LessonsListView rendering", () => {
  it("renders a table row and a phone card per lesson with status and payment text", () => {
    renderList({ lessons: makeLessons(3) });
    expect(screen.getByRole("heading", { name: "Lessons" })).toBeTruthy();
    // 3 rows in the table + 3 cards: each student name appears twice.
    expect(screen.getAllByText("Student 2")).toHaveLength(2);
    expect(screen.getAllByText("Completed").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Unpaid").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByRole("columnheader", { name: /Payment/ })).toBeTruthy();
  });

  it("shows the empty state when no lessons match", () => {
    renderList({ lessons: [], totalCount: 0 });
    expect(screen.getByText("No lessons match these filters.")).toBeTruthy();
  });

  it("shows pagination only when there is more than one page", () => {
    renderList({ lessons: makeLessons(3), totalCount: 120, pageSize: 50 });
    expect(screen.getByText("Page 1 of 3 · 120 lessons")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it("pushes the next page through the router, keeping existing params", async () => {
    const user = userEvent.setup();
    renderList({ lessons: makeLessons(3), totalCount: 120, pageSize: 50 });
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.push).toHaveBeenCalledWith("/dashboard/lessons?status=completed&page=2");
  });

  it("has no bulk bar until something is selected", () => {
    renderList();
    expect(screen.queryByRole("button", { name: "Mark as paid" })).toBeNull();
  });
});

describe("LessonsListView selection", () => {
  it("shows a count and the bulk bar when one row is selected", async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(rowCheckboxes()[0] as HTMLElement);
    expect(screen.getByText("1 lesson selected")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mark as paid" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mark as unpaid" })).toBeTruthy();
  });

  it("selects every row from the header checkbox and clears it", async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole("checkbox", { name: "Select all visible lessons" }));
    expect(screen.getByText("3 lessons selected")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.queryByText("3 lessons selected")).toBeNull();
  });

  it("sends the selected ids to the bulk action and refreshes on success", async () => {
    mocks.bulk.mockResolvedValue({ updatedCount: 2 });
    const user = userEvent.setup();
    renderList();
    await user.click(rowCheckboxes()[0] as HTMLElement);
    await user.click(rowCheckboxes()[1] as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Mark as paid" }));

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("2 lessons marked paid."),
    );
    expect(mocks.bulk).toHaveBeenCalledWith(["lesson-1", "lesson-2"], "paid");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Mark as paid" })).toBeNull();
  });

  it("shows a returned error as an alert and keeps the selection", async () => {
    mocks.bulk.mockResolvedValue({ error: "Nothing updated." });
    const user = userEvent.setup();
    renderList();
    await user.click(rowCheckboxes()[0] as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Mark as unpaid" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Nothing updated."));
    expect(screen.getByText("1 lesson selected")).toBeTruthy();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("shows a generic alert and keeps the selection when the action throws", async () => {
    mocks.bulk.mockRejectedValue(new Error("db secret text"));
    const user = userEvent.setup();
    renderList();
    await user.click(rowCheckboxes()[0] as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Mark as paid" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toBe(
      "Couldn't update the lessons. Your selection is kept. Try again.",
    );
    expect(screen.getByRole("alert").textContent).not.toContain("secret");
    expect(screen.getByText("1 lesson selected")).toBeTruthy();
  });
});

describe("LessonsListView select all matching", () => {
  async function selectWholePage(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("checkbox", { name: "Select all visible lessons" }));
  }

  it("does not offer all-matching when the page is the whole result", async () => {
    const user = userEvent.setup();
    renderList({ lessons: makeLessons(3), totalCount: 3 });
    await selectWholePage(user);
    expect(screen.queryByRole("button", { name: /Select all \d+ matching/ })).toBeNull();
  });

  it("does not offer all-matching for a partial page selection", async () => {
    const user = userEvent.setup();
    renderList({ lessons: makeLessons(3), totalCount: 130 });
    await user.click(rowCheckboxes()[0] as HTMLElement);
    expect(screen.queryByRole("button", { name: /Select all \d+ matching/ })).toBeNull();
  });

  it("offers the banner once the whole page is selected and total exceeds it", async () => {
    const user = userEvent.setup();
    renderList({ lessons: makeLessons(3), totalCount: 130 });
    await selectWholePage(user);
    expect(screen.getByText(/All 3 lessons on this page are selected\./)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select all 130 matching" })).toBeTruthy();
  });

  it("switches to all-matching mode and drops it when a single row is toggled", async () => {
    const user = userEvent.setup();
    renderList({ lessons: makeLessons(3), totalCount: 130 });
    await selectWholePage(user);
    await user.click(screen.getByRole("button", { name: "Select all 130 matching" }));
    expect(screen.getByText("All 130 matching lessons selected")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Select all 130 matching" })).toBeNull();

    await user.click(rowCheckboxes()[0] as HTMLElement);
    expect(screen.queryByText("All 130 matching lessons selected")).toBeNull();
    expect(screen.getByText("2 lessons selected")).toBeTruthy();
  });

  it("confirms before updating and sends filters plus the expected count, not ids", async () => {
    mocks.bulkForFilter.mockResolvedValue({ updatedCount: 100, matchedCount: 130 });
    const user = userEvent.setup();
    renderList({ lessons: makeLessons(3), totalCount: 130 });
    await selectWholePage(user);
    await user.click(screen.getByRole("button", { name: "Select all 130 matching" }));
    await user.click(screen.getByRole("button", { name: "Mark as paid" }));

    // Nothing is sent until the confirm modal is accepted.
    expect(mocks.bulkForFilter).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Mark 130 lessons paid?" })).toBeTruthy();
    expect(screen.getByText(/including those on other pages/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Mark 130 paid" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "100 lessons marked paid. 30 already paid.",
      ),
    );
    expect(mocks.bulkForFilter).toHaveBeenCalledWith(
      { status: "completed", student: undefined, subject: undefined, payment: "unpaid" },
      "paid",
      130,
    );
    expect(mocks.bulk).not.toHaveBeenCalled();
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("All 130 matching lessons selected")).toBeNull();
  });

  it("sends nothing when the confirm modal is cancelled", async () => {
    const user = userEvent.setup();
    renderList({ lessons: makeLessons(3), totalCount: 130 });
    await selectWholePage(user);
    await user.click(screen.getByRole("button", { name: "Select all 130 matching" }));
    await user.click(screen.getByRole("button", { name: "Mark as unpaid" }));
    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(mocks.bulkForFilter).not.toHaveBeenCalled();
    expect(screen.getByText("All 130 matching lessons selected")).toBeTruthy();
  });

  it("shows an alert and keeps all-matching mode when the filter action fails", async () => {
    mocks.bulkForFilter.mockResolvedValue({ error: "The list changed. Reload and try again." });
    const user = userEvent.setup();
    renderList({ lessons: makeLessons(3), totalCount: 130 });
    await selectWholePage(user);
    await user.click(screen.getByRole("button", { name: "Select all 130 matching" }));
    await user.click(screen.getByRole("button", { name: "Mark as paid" }));
    await user.click(screen.getByRole("button", { name: "Mark 130 paid" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("The list changed. Reload and try again."),
    );
    expect(screen.getByText("All 130 matching lessons selected")).toBeTruthy();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
