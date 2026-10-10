import { describe, expect, it, vi } from "vitest";
import { canSendEmail, getNotificationConfig } from "../features/notifications/config";
import { handleCronRequest } from "../features/notifications/cron-handler";
import { isAuthorizedCron } from "../features/notifications/cron-auth";
import {
  buildBalanceReminderEmail,
  buildLessonReminderEmail,
  escapeHtml,
  safeHttpUrl,
} from "../features/notifications/email-content";
import {
  getReminderWindow,
  REMINDER_WINDOW_HOURS,
} from "../features/notifications/reminder-window";
import { sendEmail } from "../features/notifications/resend";
import {
  maskEmail,
  pickRecipient,
  sendBalanceReminderSchema,
} from "../features/notifications/schemas";

describe("master switch / config", () => {
  it("defaults to off when unset", () => {
    expect(getNotificationConfig({}).enabled).toBe(false);
  });
  it("only the exact string true enables", () => {
    for (const value of ["", "false", "1", "yes", "on"]) {
      expect(getNotificationConfig({ EMAIL_NOTIFICATIONS_ENABLED: value }).enabled).toBe(false);
    }
    expect(getNotificationConfig({ EMAIL_NOTIFICATIONS_ENABLED: "true" }).enabled).toBe(true);
  });
  it("needs key and sender as well as the switch", () => {
    const base = { EMAIL_NOTIFICATIONS_ENABLED: "true" };
    expect(canSendEmail(getNotificationConfig(base))).toBe(false);
    expect(canSendEmail(getNotificationConfig({ ...base, RESEND_API_KEY: "k" }))).toBe(false);
    expect(
      canSendEmail(getNotificationConfig({ ...base, RESEND_API_KEY: "k", EMAIL_FROM: "a@b.co" })),
    ).toBe(true);
    expect(canSendEmail(getNotificationConfig({ RESEND_API_KEY: "k", EMAIL_FROM: "a@b.co" }))).toBe(
      false,
    );
  });
});

describe("cron authentication", () => {
  it("accepts the exact bearer secret", () => {
    expect(isAuthorizedCron("Bearer s3cret", "s3cret")).toBe(true);
  });
  it("rejects missing, wrong, malformed or unset secrets", () => {
    expect(isAuthorizedCron(null, "s3cret")).toBe(false);
    expect(isAuthorizedCron("Bearer nope", "s3cret")).toBe(false);
    expect(isAuthorizedCron("s3cret", "s3cret")).toBe(false);
    expect(isAuthorizedCron("Bearer s3cret", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
  });
});

describe("cron handler", () => {
  const request = (auth?: string) =>
    new Request("http://localhost/api/cron/lesson-reminders", {
      headers: auth ? { authorization: auth } : {},
    });

  it("returns 401 without running when unauthenticated", async () => {
    const run = vi.fn();
    const config = getNotificationConfig({ CRON_SECRET: "x", EMAIL_NOTIFICATIONS_ENABLED: "true" });
    const response = await handleCronRequest(request(), run, config);
    expect(response.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });
  it("returns 200 disabled and never runs when the switch is off", async () => {
    const run = vi.fn();
    const config = getNotificationConfig({ CRON_SECRET: "x" });
    const response = await handleCronRequest(request("Bearer x"), run, config);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ disabled: true });
    expect(run).not.toHaveBeenCalled();
  });
  it("runs when authenticated and enabled", async () => {
    const run = vi.fn().mockResolvedValue({ sent: 1 });
    const config = getNotificationConfig({ CRON_SECRET: "x", EMAIL_NOTIFICATIONS_ENABLED: "true" });
    const response = await handleCronRequest(request("Bearer x"), run, config);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ disabled: false, summary: { sent: 1 } });
    expect(run).toHaveBeenCalledOnce();
  });
});

describe("reminder window", () => {
  it("covers (now, now + 24h]", () => {
    const now = new Date("2026-10-10T06:00:00Z");
    const { from, to } = getReminderWindow(now);
    expect(from).toEqual(now);
    expect(to.getTime() - now.getTime()).toBe(REMINDER_WINDOW_HOURS * 3_600_000);
  });
  it("consecutive daily or hourly windows leave no gap", () => {
    const first = new Date("2026-10-10T06:00:00Z");
    for (const stepHours of [1, 24]) {
      const next = new Date(first.getTime() + stepHours * 3_600_000);
      expect(getReminderWindow(first).to.getTime()).toBeGreaterThanOrEqual(next.getTime());
    }
  });
});

describe("email content", () => {
  const lesson = {
    studentName: "Ann <script>alert(1)</script>",
    tutorName: 'Bob "the" Tutor & Co',
    startIso: "2026-10-12T22:30:00Z",
    endIso: "2026-10-12T23:30:00Z",
    subjectName: "Math\r\nBcc: evil@example.com",
    meetingUrl: "https://meet.example.com/room?a=1&b=2",
    timeZone: "Asia/Tokyo",
    locale: "en-US",
  };

  it("escapes user-controlled fields in html", () => {
    const { html } = buildLessonReminderEmail(lesson);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Bob &quot;the&quot; Tutor &amp; Co");
    expect(html).toContain("a=1&amp;b=2");
  });
  it("keeps the subject on one line", () => {
    const { subject } = buildLessonReminderEmail(lesson);
    expect(subject).not.toMatch(/[\r\n]/);
    const noTutor = buildLessonReminderEmail({ ...lesson, tutorName: "A\r\nBcc: x" });
    expect(noTutor.subject).not.toMatch(/[\r\n]/);
  });
  it("formats the time in the tutor timezone", () => {
    // 22:30Z is 07:30 the next day in Tokyo (UTC+9).
    const { text } = buildLessonReminderEmail(lesson);
    expect(text).toContain("October 13");
    expect(text).toContain("7:30");
    expect(text).toContain("Asia/Tokyo");
    expect(text).toContain("60 minutes");
  });
  it("omits the meeting link unless it is http(s)", () => {
    const { html, text } = buildLessonReminderEmail({
      ...lesson,
      meetingUrl: "javascript:alert(1)",
    });
    expect(html).not.toContain("javascript:");
    expect(text).not.toContain("Meeting link");
    expect(safeHttpUrl("ftp://x.example")).toBeNull();
    expect(safeHttpUrl("https://x.example/a")).toBe("https://x.example/a");
  });
  it("builds a balance reminder with per-currency totals and escaped instructions", () => {
    const { html, text, subject } = buildBalanceReminderEmail({
      studentName: "Ann",
      tutorName: "Bob",
      totals: [
        { currency: "USD", total: 120, count: 2 },
        { currency: "EUR", total: 30, count: 1 },
      ],
      paymentInstructions: "IBAN <b>123</b>\nPayPal: bob@example.com",
      tutorContactEmail: "bob@example.com",
      locale: "en-US",
    });
    expect(text).toContain("$120.00 for 2 unpaid lessons");
    expect(text).toContain("€30.00 for 1 unpaid lesson");
    expect(html).toContain("IBAN &lt;b&gt;123&lt;/b&gt;<br>PayPal");
    expect(html).not.toContain("<b>123</b>");
    expect(subject).toBe("Payment reminder from Bob");
  });
  it("escapeHtml handles all special characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});

describe("recipient helpers", () => {
  it("picks the first valid address and rejects header-injection attempts", () => {
    expect(pickRecipient(null, " a@b.co ")).toBe("a@b.co");
    expect(pickRecipient("a@b.co\r\nBcc: x@y.z", "ok@b.co")).toBe("ok@b.co");
    expect(pickRecipient("", undefined)).toBeNull();
  });
  it("masks addresses", () => {
    expect(maskEmail("student@example.com")).toBe("s***@example.com");
    expect(maskEmail("nonsense")).toBe("***");
  });
  it("requires a uuid student id", () => {
    expect(sendBalanceReminderSchema.safeParse({ studentId: "nope" }).success).toBe(false);
    expect(
      sendBalanceReminderSchema.safeParse({ studentId: "6f1c2a3e-1b2c-4d5e-8f90-a1b2c3d4e5f6" })
        .success,
    ).toBe(true);
  });
});

describe("Resend request", () => {
  const message = {
    from: "TutorDesk <n@example.com>",
    to: "a@b.co",
    subject: "S",
    html: "<p>h</p>",
    text: "t",
    idempotencyKey: "lesson-reminder/1",
  };

  it("posts the expected request without touching the network", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const result = await sendEmail("re_key", message, fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer re_key");
    expect(init.headers["Idempotency-Key"]).toBe("lesson-reminder/1");
    expect(JSON.parse(init.body)).toEqual({
      from: message.from,
      to: ["a@b.co"],
      subject: "S",
      html: "<p>h</p>",
      text: "t",
    });
  });
  it("reports rate limiting and other failures as codes, never throwing", async () => {
    const limited = vi.fn().mockResolvedValue(new Response("{}", { status: 429 }));
    expect(await sendEmail("k", message, limited as unknown as typeof fetch)).toEqual({
      ok: false,
      rateLimited: true,
      code: "http_429",
    });
    const bad = vi.fn().mockResolvedValue(new Response("{}", { status: 422 }));
    expect(await sendEmail("k", message, bad as unknown as typeof fetch)).toEqual({
      ok: false,
      rateLimited: false,
      code: "http_422",
    });
    const boom = vi.fn().mockRejectedValue(new Error("secret re_key leaked?"));
    expect(await sendEmail("k", message, boom as unknown as typeof fetch)).toEqual({
      ok: false,
      rateLimited: false,
      code: "network_error",
    });
  });
});
