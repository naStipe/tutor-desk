// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeekAgenda } from "../features/lessons/components/WeekAgenda";
import type { AgendaLesson } from "../features/lessons/components/ScheduleAgenda";

// Monday 12 Oct 2026 .. Sunday 18 Oct 2026, as the server passes them (local midnight, no offset).
const DAYS = [12, 13, 14, 15, 16, 17, 18].map((day) => `2026-10-${day}T00:00:00`);

function lesson(overrides: Partial<AgendaLesson> & { id: string }): AgendaLesson {
  return {
    studentName: "Ann Student",
    subjectName: "Math",
    startTime: "2026-10-14T10:00:00.000Z",
    endTime: "2026-10-14T11:00:00.000Z",
    status: "scheduled",
    paymentStatus: "unpaid",
    ...overrides,
  };
}

beforeEach(() => {
  vi.setSystemTime(new Date("2026-10-14T12:00:00.000Z"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderAgenda(lessons: AgendaLesson[]) {
  return render(
    <WeekAgenda dayStartValues={DAYS} lessons={lessons} timeZone="UTC" locale="en-US" />,
  );
}

describe("WeekAgenda", () => {
  it("renders one section per day, seven in total", () => {
    renderAgenda([]);
    expect(document.querySelectorAll("section")).toHaveLength(7);
    for (const day of DAYS) {
      expect(screen.getByRole("region", { name: day.slice(0, 10) })).toBeTruthy();
    }
  });

  it("marks only today (in the tutor time zone) with a Today pill", () => {
    renderAgenda([]);
    const pills = screen.getAllByText("Today");
    expect(pills).toHaveLength(1);
    const todaySection = screen.getByRole("region", { name: "2026-10-14" });
    expect(within(todaySection).getByText("Today")).toBeTruthy();
  });

  it("labels days without lessons as Free", () => {
    renderAgenda([]);
    expect(screen.getAllByText("Free")).toHaveLength(7);
  });

  it("shows a lesson with time range, student, subject and status text", () => {
    renderAgenda([
      lesson({ id: "l1" }),
      lesson({
        id: "l2",
        studentName: "Bob Student",
        subjectName: null,
        startTime: "2026-10-14T14:00:00.000Z",
        endTime: "2026-10-14T15:00:00.000Z",
        status: "completed",
        paymentStatus: "paid",
      }),
    ]);
    const section = screen.getByRole("region", { name: "2026-10-14" });
    expect(within(section).getByText("2 lessons · open day →")).toBeTruthy();
    expect(within(section).getByText("10:00 AM – 11:00 AM")).toBeTruthy();
    expect(within(section).getByText("Ann Student · Math")).toBeTruthy();
    expect(within(section).getByText("Bob Student")).toBeTruthy();
    expect(within(section).getByText("Scheduled")).toBeTruthy();
    expect(within(section).getByText("Completed")).toBeTruthy();
    expect(within(section).getByText("Paid")).toBeTruthy();
  });

  it("orders a day's lessons by start time", () => {
    renderAgenda([
      lesson({
        id: "late",
        studentName: "Late",
        startTime: "2026-10-14T16:00:00.000Z",
        endTime: "2026-10-14T17:00:00.000Z",
      }),
      lesson({ id: "early", studentName: "Early", startTime: "2026-10-14T08:00:00.000Z" }),
    ]);
    const section = screen.getByRole("region", { name: "2026-10-14" });
    const items = within(section).getAllByRole("listitem");
    expect(items[0]?.textContent).toContain("Early");
    expect(items[1]?.textContent).toContain("Late");
  });

  it("uses the singular for one lesson and keeps other days Free", () => {
    renderAgenda([lesson({ id: "l1" })]);
    expect(screen.getByText("1 lesson · open day →")).toBeTruthy();
    expect(screen.getAllByText("Free")).toHaveLength(6);
  });

  it("shows cancelled and no-show lessons by status text", () => {
    renderAgenda([
      lesson({ id: "c", status: "cancelled" }),
      lesson({
        id: "n",
        status: "no_show",
        startTime: "2026-10-15T10:00:00.000Z",
        endTime: "2026-10-15T11:00:00.000Z",
      }),
    ]);
    expect(screen.getByText("Cancelled")).toBeTruthy();
    expect(screen.getByText("No-show")).toBeTruthy();
  });

  it("places a lesson on the day it falls in for the tutor time zone", () => {
    // 23:30 UTC on the 14th is already the 15th in Auckland (UTC+13 in October).
    render(
      <WeekAgenda
        dayStartValues={DAYS}
        lessons={[
          lesson({
            id: "z",
            startTime: "2026-10-14T23:30:00.000Z",
            endTime: "2026-10-15T00:30:00.000Z",
          }),
        ]}
        timeZone="Pacific/Auckland"
        locale="en-US"
      />,
    );
    const day15 = screen.getByRole("region", { name: "2026-10-15" });
    expect(within(day15).getByText("Ann Student · Math")).toBeTruthy();
    const day14 = screen.getByRole("region", { name: "2026-10-14" });
    expect(within(day14).queryByText("Ann Student · Math")).toBeNull();
  });

  it("links each day heading to its day view and each lesson to its page", () => {
    renderAgenda([lesson({ id: "abc" })]);
    const section = screen.getByRole("region", { name: "2026-10-14" });
    const links = within(section).getAllByRole("link");
    expect(links[0]?.getAttribute("href")).toBe("/dashboard/schedule?view=day&date=2026-10-14");
    expect(links[1]?.getAttribute("href")).toBe("/dashboard/lessons/abc");
  });
});
