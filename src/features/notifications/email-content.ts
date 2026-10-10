import { formatMoney } from "../../lib/formatting";
import { formatFullDateTime } from "../lessons/date-utils";

export type EmailContent = { subject: string; html: string; text: string };

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Collapses CR/LF and runs of whitespace so user text cannot break a subject line. */
function oneLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Only http(s) links are ever rendered as a link; anything else is dropped. */
export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function layout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:16px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#18181b;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">${escapeHtml(title)}</h1>
${bodyHtml}
</div></body></html>`;
}

function paragraphs(text: string) {
  return text
    .split(/\n+/)
    .map((line) => escapeHtml(line))
    .join("<br>");
}

export type LessonReminderInput = {
  studentName: string;
  tutorName: string | null;
  startIso: string;
  endIso: string;
  subjectName: string | null;
  meetingUrl: string | null;
  timeZone: string;
  locale: string;
};

export function buildLessonReminderEmail(input: LessonReminderInput): EmailContent {
  const tutor = input.tutorName ? oneLine(input.tutorName) : "your tutor";
  const student = oneLine(input.studentName);
  const when = formatFullDateTime(input.startIso, input.timeZone, input.locale);
  const minutes = Math.round(
    (new Date(input.endIso).getTime() - new Date(input.startIso).getTime()) / 60_000,
  );
  const subject = input.subjectName ? oneLine(input.subjectName) : null;
  const meetingUrl = safeHttpUrl(input.meetingUrl);
  const title = `Lesson reminder: ${when}`;

  const rows: Array<[string, string]> = [
    ["Student", student],
    ["Tutor", tutor],
    ["When", `${when} (${input.timeZone})`],
    ["Duration", `${minutes} minutes`],
  ];
  if (subject) rows.push(["Subject", subject]);

  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 8px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join("\n");
  const linkHtml = meetingUrl
    ? `<p style="margin:16px 0 0;"><a href="${escapeHtml(meetingUrl)}" style="display:inline-block;padding:12px 20px;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:6px;">Join the lesson</a></p>
<p style="margin:12px 0 0;font-size:14px;color:#52525b;">Link: ${escapeHtml(meetingUrl)}</p>`
    : "";

  const text = [
    `Lesson reminder`,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(meetingUrl ? [`Meeting link: ${meetingUrl}`] : []),
  ].join("\n");

  return {
    subject: oneLine(`Lesson reminder: ${when} with ${tutor}`),
    html: layout(title, `${rowsHtml}\n${linkHtml}`),
    text,
  };
}

export type BalanceReminderInput = {
  studentName: string;
  tutorName: string | null;
  totals: Array<{ currency: string; total: number; count: number }>;
  paymentInstructions: string | null;
  tutorContactEmail: string | null;
  locale: string;
};

export function buildBalanceReminderEmail(input: BalanceReminderInput): EmailContent {
  const tutor = input.tutorName ? oneLine(input.tutorName) : "your tutor";
  const student = oneLine(input.studentName);
  const lines = input.totals.map(
    (row) =>
      `${formatMoney(row.total, row.currency, input.locale)} for ${row.count} unpaid lesson${row.count === 1 ? "" : "s"}`,
  );
  const instructions = input.paymentInstructions?.trim() || null;
  const contact = input.tutorContactEmail ? oneLine(input.tutorContactEmail) : null;

  const intro = `This is a friendly reminder that ${student} has an outstanding balance with ${tutor}.`;
  const linesHtml = lines
    .map((line) => `<li style="margin:0 0 4px;">${escapeHtml(line)}</li>`)
    .join("");
  const instructionsHtml = instructions
    ? `<h2 style="margin:20px 0 8px;font-size:16px;">How to pay</h2><p style="margin:0;">${paragraphs(instructions)}</p>`
    : "";
  const contactHtml = contact
    ? `<p style="margin:20px 0 0;font-size:14px;color:#52525b;">Questions? Contact ${escapeHtml(contact)}.</p>`
    : "";

  const text = [
    intro,
    "",
    "Amount owed:",
    ...lines.map((line) => `- ${line}`),
    ...(instructions ? ["", "How to pay:", instructions] : []),
    ...(contact ? ["", `Questions? Contact ${contact}.`] : []),
  ].join("\n");

  return {
    subject: oneLine(`Payment reminder from ${tutor}`),
    html: layout(
      "Payment reminder",
      `<p style="margin:0 0 12px;">${escapeHtml(intro)}</p><ul style="margin:0;padding-left:20px;">${linesHtml}</ul>${instructionsHtml}${contactHtml}`,
    ),
    text,
  };
}
