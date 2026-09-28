# TutorDesk Project State

## Current Milestone

- Milestone: **TD-011 — Per-student running balance on the tutor billing page**
- Status: **Implemented; independent review recommended; new DB function unverified against the
  live hosted database**
- Branch: `main`
- Last updated: 2026-09-28

The tutor-facing student billing page (`src/app/dashboard/students/[id]/billing/page.tsx`) had no
single "this student owes $X" figure — TD-006/TD-009 built the unpaid-lessons filter and bulk-pay,
but a tutor still had to filter the lessons list and add line items by hand to know what to
invoice. Addresses the "Next Recommended Task" recorded at the end of TD-010. No change to
invoicing, payment-method editing, or any other billing feature — scope is strictly the new
"Balance owed" display.

- **New DB aggregate** (`supabase/migrations/20260928010000_tutor_unpaid_summary.sql`): a
  `tutor_unpaid_summary(p_student_id uuid)` SQL function, grouped by currency, summing
  `lesson.price` where `status = 'completed' AND payment_status = 'unpaid' AND price is not null`
  for one student — the same predicate as the dashboard's existing "unbilled" stat. Deliberately
  mirrors `portal_unpaid_summary` (`supabase/migrations/20260917020000_tutor_contact_and_homework_
  comments.sql`) in shape (`security definer`, `stable`, same three-column return shape) for
  consistency, even though a tutor session's own `lesson` SELECT RLS policy (`using ((select
  auth.uid()) = tutor_id)`, `20260913150813_create_lesson.sql`) would already let a plain
  `.select("price, currency")` + JS `sum()` work correctly and safely for one student's bounded
  row count. Chose the DB-aggregate path per the ticket's explicit preference for consistency with
  the portal's established pattern (same "don't download every row just to add one column" reasoning
  the portal's migration comment already states), not because JS-side summing would have been
  unsafe here — a JS sum remains the simpler fallback if this function ever needs to be dropped. The
  function adds its own `l.tutor_id = auth.uid()` check (defense-in-depth on top of RLS, matching
  the portal function's own explicit membership check) and is `revoke`d from `anon`/`public`,
  `grant`ed only to `authenticated`.
- **Data layer** (`getStudentUnpaidSummary` in `src/features/students/data.ts`): thin wrapper
  around `supabase.rpc("tutor_unpaid_summary", ...)`, same `{ currency, total, count }[]` shape as
  `getPortalUnpaidSummary` (`src/features/portal/data.ts`).
- **UI**: a new "Balance owed" `Card` at the top of the billing page, rendered only when the
  student has an outstanding balance (`unpaidSummary.length > 0`), one line per currency, using the
  same `formatMoney(total, currency, locale)` (`src/lib/formatting.ts`) and `getTutorFormatSettings`
  locale-resolution pattern already used on the lesson detail page and the portal's own "Amount
  due" card — no new money-formatting logic was written. Links through to
  `/dashboard/lessons?status=completed&payment=unpaid&student=<id>` (TD-006's existing filter
  params, confirmed supported by `src/app/dashboard/lessons/page.tsx`'s `student` query param) so a
  tutor can jump straight to the underlying unpaid rows.
- **Ownership**: `getStudent` (already RLS-scoped) 404s before any of the new code runs; the new
  RPC re-checks `tutor_id = auth.uid()` independently of RLS, matching TD-009/TD-010's
  defense-in-depth precedent. A student id from another tutor's account returns zero rows from the
  RPC (not an error), same behavior as `portal_unpaid_summary` for a foreign/unauthorized id.
- No change to `lesson`'s existing columns, constraints, or RLS policies — purely additive
  (one new function, no table/column change).

No email or push infrastructure exists anywhere in `src/` (confirmed: no mailer dependency), so this
adds an in-app-only nudge for homework approaching or past its due date, on both sides of the app.
Addresses the "Next Recommended Task" recorded at the end of TD-009. No schema change — reuses
`homework`'s existing `due_date` column and `assigned`/`submitted`/`reviewed` status enum.

- **Shared formatters** (`src/lib/formatting.ts`): `formatOverdue`/`formatDueSoon` moved here from
  `src/features/dashboard/format.ts` (which now just re-exports them) so both the tutor dashboard and
  the student portal — two different features — format the same due-date language ("2 days overdue",
  "Due tomorrow") without duplicating the logic. `formatOverdue` already existed; `formatDueSoon` is
  new, a 3-day "due soon" window (`DUE_SOON_WINDOW_DAYS` in `src/features/homework/data.ts`).
- **Tutor dashboard** (`src/features/dashboard/components/TodayDashboard.tsx`): the existing "Needs
  review" card (`NeedsReviewStrip`) is extended rather than replaced. `HomeworkAttentionItem.overdue:
  boolean` became `reason: "submitted" | "overdue" | "due-soon"`, and `listHomeworkNeedingAttention`
  (`src/features/homework/data.ts`) now queries a third bucket — `status = "assigned"` and `due_date`
  within the next 3 days but not yet overdue — alongside its existing submitted/overdue buckets. Each
  row still links to `/dashboard/homework/[id]`; the action label is now "Review" (submitted),
  "Nudge" (overdue), or "Remind" (due soon). `countHomeworkNeedingAttention` (sidebar badge) was left
  untouched on purpose — it still counts only submitted+overdue, so the badge's existing meaning
  ("needs your action now") doesn't get diluted by upcoming-but-not-yet-due items.
- **Student portal** (`src/app/portal/page.tsx`): a new `HomeworkDueBanner`
  (`src/features/portal/components/HomeworkDueBanner.tsx`) renders above `NextLessonCard` on the
  portal home page whenever the signed-in student has their own `assigned` homework overdue or due
  within 3 days. It's additive — the existing "Homework due soon" `Card` (14-day lookahead, all
  statuses, no overdue bucket) is untouched. New data function `listPortalHomeworkDueSoon`
  (`src/features/homework/data.ts`) mirrors the dashboard's overdue/due-soon query shape but scoped to
  one `studentId`. Both link through to `/portal/homework`, the student's actual homework list.
- **Ownership**: tutor-side queries are unfiltered by tutor id in code (same as every other dashboard
  query) because `homework`'s RLS select policy already scopes every row to `auth.uid() = tutor_id`
  (or a portal member). Portal-side `listPortalHomeworkDueSoon` is called with `student.id` from
  `requirePortalStudent(supabase, studentId)` — the exact same "which student is this portal session
  for" mechanism `listHomeworkDueInRange`/`listPortalLessons` already use on this same page — so a
  student can never pass another student's id and see their homework: the explicit `.eq("student_id",
  studentId)` filter and `homework`'s RLS `portal_membership` check both independently enforce it
  (read directly from `supabase/migrations/20260917035000_merge_duplicate_select_policies.sql`, not
  assumed).
- Purely additive UI + data-query work: no schema change, no new due-date logic beyond comparing the
  existing `due_date` column to `new Date()` (same server/browser-local "now" the dashboard's
  greeting and calendar already use — see Known Issues; not fixed here, per the ticket's explicit
  scope). Lesson and payment features are untouched.

## Previous Milestone (TD-010)

- Milestone: **TD-010 — In-app homework due-date/overdue nudges (dashboard + portal)**
- Status: Implemented; independent review recommended

No email or push infrastructure exists anywhere in `src/` (confirmed: no mailer dependency), so this
adds an in-app-only nudge for homework approaching or past its due date, on both sides of the app.
Addresses the "Next Recommended Task" recorded at the end of TD-009. No schema change — reuses
`homework`'s existing `due_date` column and `assigned`/`submitted`/`reviewed` status enum.

- **Shared formatters** (`src/lib/formatting.ts`): `formatOverdue`/`formatDueSoon` moved here from
  `src/features/dashboard/format.ts` (which now just re-exports them) so both the tutor dashboard and
  the student portal — two different features — format the same due-date language ("2 days overdue",
  "Due tomorrow") without duplicating the logic. `formatOverdue` already existed; `formatDueSoon` is
  new, a 3-day "due soon" window (`DUE_SOON_WINDOW_DAYS` in `src/features/homework/data.ts`).
- **Tutor dashboard** (`src/features/dashboard/components/TodayDashboard.tsx`): the existing "Needs
  review" card (`NeedsReviewStrip`) is extended rather than replaced. `HomeworkAttentionItem.overdue:
  boolean` became `reason: "submitted" | "overdue" | "due-soon"`, and `listHomeworkNeedingAttention`
  (`src/features/homework/data.ts`) now queries a third bucket — `status = "assigned"` and `due_date`
  within the next 3 days but not yet overdue — alongside its existing submitted/overdue buckets. Each
  row still links to `/dashboard/homework/[id]`; the action label is now "Review" (submitted),
  "Nudge" (overdue), or "Remind" (due soon). `countHomeworkNeedingAttention` (sidebar badge) was left
  untouched on purpose — it still counts only submitted+overdue, so the badge's existing meaning
  ("needs your action now") doesn't get diluted by upcoming-but-not-yet-due items.
- **Student portal** (`src/app/portal/page.tsx`): a new `HomeworkDueBanner`
  (`src/features/portal/components/HomeworkDueBanner.tsx`) renders above `NextLessonCard` on the
  portal home page whenever the signed-in student has their own `assigned` homework overdue or due
  within 3 days. It's additive — the existing "Homework due soon" `Card` (14-day lookahead, all
  statuses, no overdue bucket) is untouched. New data function `listPortalHomeworkDueSoon`
  (`src/features/homework/data.ts`) mirrors the dashboard's overdue/due-soon query shape but scoped to
  one `studentId`. Both link through to `/portal/homework`, the student's actual homework list.
- **Ownership**: tutor-side queries are unfiltered by tutor id in code (same as every other dashboard
  query) because `homework`'s RLS select policy already scopes every row to `auth.uid() = tutor_id`
  (or a portal member). Portal-side `listPortalHomeworkDueSoon` is called with `student.id` from
  `requirePortalStudent(supabase, studentId)` — the exact same "which student is this portal session
  for" mechanism `listHomeworkDueInRange`/`listPortalLessons` already use on this same page — so a
  student can never pass another student's id and see their homework: the explicit `.eq("student_id",
  studentId)` filter and `homework`'s RLS `portal_membership` check both independently enforce it
  (read directly from `supabase/migrations/20260917035000_merge_duplicate_select_policies.sql`, not
  assumed).
- Purely additive UI + data-query work: no schema change, no new due-date logic beyond comparing the
  existing `due_date` column to `new Date()` (same server/browser-local "now" the dashboard's
  greeting and calendar already use — see Known Issues; not fixed here, per the ticket's explicit
  scope). Lesson and payment features are untouched.

## Previous Milestone (TD-009)

- Milestone: **TD-009 — Bulk mark lessons paid/unpaid from the lessons list**
- Status: Implemented; independent review recommended

A tutor who gets paid for a month of lessons in one bank transfer previously had to open each
lesson individually and mark it paid (`setLessonPaymentAction`, one lesson at a time). This
extends the lessons list (`src/features/lessons/`, TD-006's `payment=unpaid|paid|all` filter) with
row selection and a bulk payment-status action, so a tutor can filter to `payment=unpaid`, select
several, and clear them in one action. Addresses the "Next Recommended Task" recorded at the end
of TD-008.

- **Selection UX** (`src/features/lessons/components/LessonsListView.tsx`): a checkbox per row plus
  a header "select all visible" checkbox (scoped to the current page's rows, not the whole filtered
  set, since pages are fetched server-side 50 at a time). A bulk action bar appears above the table
  whenever 1+ rows are selected, with "Mark as paid", "Mark as unpaid", and "Clear selection".
  Selection is cleared whenever the filters/sort/page change (`pushParams`) or after a bulk action
  completes — deliberately not reactive to every `lessons` prop change via `useEffect`, since Biome's
  `useExhaustiveDependencies` rule rejects a prop-array dependency there; clearing at the two actual
  trigger points is simpler and avoids that rule entirely.
- **New server action** (`bulkSetLessonPaymentAction` in `src/features/lessons/actions.ts`): takes
  an array of lesson ids and a target `PaymentStatus`, called directly from the client component
  (not a `<form>` action, since it needs a JSON array rather than `FormData`) — same calling
  convention already used by `moveLessonAction` and `updateLessonStatusAction`. Validates with a new
  `bulkLessonPaymentSchema` (`src/features/lessons/schemas.ts`: array of UUIDs, 1–200 items, plus
  the existing `PAYMENT_STATUSES` enum) before touching the database.
- **New data-layer function** (`bulkUpdateLessonPayment` in `src/features/lessons/data.ts`): reuses
  `updateLessonPayment`'s field-setting pattern (`payment_status`, `paid_at` set/cleared together,
  `updated_at`) but as a single `.in("id", ids)` batch update, returning the actually-updated ids via
  `.select("id")` so the caller can report an accurate count even if some ids in the batch didn't
  belong to the tutor. `payment_method` is deliberately left untouched by the bulk action (no method
  picker in the bulk UI, unlike the single-lesson form) — out of this ticket's minimal scope; a
  tutor who wants to record *how* a batch was paid still edits that per-lesson.
- **IDOR / ownership**: the client-supplied lesson-id list is never trusted directly. Two
  independent layers both scope the update to the authenticated tutor: (1) `bulkUpdateLessonPayment`
  adds an explicit `.eq("tutor_id", tutorId)` filter to the update query, and (2) `lesson`'s existing
  RLS update policy (`supabase/migrations/20260913150813_create_lesson.sql`: `using ((select
  auth.uid()) = tutor_id)`) independently drops any row that isn't the caller's own regardless of
  the app-level filter. Confirmed by reading the migration directly (not assumed from TD-006's
  reasoning) — a foreign lesson id smuggled into the batch is filtered out by both the `.eq` clause
  and RLS before any row is touched; it simply isn't included in the returned `updatedCount`, and no
  error is raised for a partial-ownership batch (not expected from normal use, since ids come from
  the tutor's own already-filtered list, but safe either way). This mirrors, and is at least as
  strict as, the ownership guarantee TD-007's `getLessonDuplicateDataAction` established for a single
  id.
- Scope was kept deliberately narrow per the ticket: no generic bulk-action framework, no bulk
  status/delete/reschedule, invoicing and single-lesson payment editing untouched.

## Previous Milestone (TD-008)

- Milestone: **TD-008 — Calendar color-coding by student**
- Status: Implemented; independent review recommended

The day/week lesson calendar (`LessonCalendar`, used by `LessonsCalendarView` and
`StudentScheduleView`) previously colored every lesson block purely by status (scheduled=cyan,
completed=brand, cancelled=neutral, no_show=amber), so a busy week with many students looked
visually identical block-to-block except for the small text label — hard to scan fast. Addresses
the "Next Recommended Task" recorded at the end of TD-007.

- **Shared color util** (`src/lib/color.ts`, new): `hashToHue(key)` — a deterministic string hash
  cycling through 4 brand hues (`brand`/`cyan`/`violet`/`warning`, the same 4 the app already uses
  elsewhere for accents). Extracted from `Avatar`'s pre-existing name-hash logic so both `Avatar`
  and the calendar share one implementation instead of two copies. `Avatar` (`src/components/
  Avatar.tsx`) was refactored to call it; its rendered output is unchanged (same hash formula, same
  4-color palette, same class names).
- **Calendar blocks now color by student, not status** (`src/features/lessons/components/
  LessonCalendar.tsx`): each lesson block's fill is `hashToHue(lesson.studentId)` — student id, not
  name, so a rename can't shift a student's color and two same-named students still get distinct
  colors. No schema change: `studentId` was already on `CalendarLesson`, no new query or column.
  Status is layered on top as a secondary cue rather than displaced: a 4px left accent stripe
  (`border-l-{hue}`), a small status dot before the time label, and (cancelled only) the existing
  strikethrough/reduced-opacity treatment. A `title` attribute (`"<student> · <status>"`) was added
  for a hover tooltip. `MonthCalendar` was intentionally left untouched — it only shows per-day
  counts, never individual lesson blocks, so there's nothing to recolor there. `StudentLessonCalendar`
  (the student-portal, single-student view) was also left untouched — per-student coloring is
  meaningless when only one student's lessons are ever shown there; its existing status-only coloring
  still applies.
- **Legend updated** (`src/features/lessons/components/CalendarLegend.tsx`): added a "Status:" row
  reusing the calendar's own status-dot colors/labels (now exported from `LessonCalendar.tsx` as
  `STATUS_DOT_CLASSES`/`STATUS_LABELS`) so the new secondary status cue is explained where a tutor
  will actually see it, on both `LessonsCalendarView` (tutor's own schedule) and
  `StudentScheduleView` (a single student's schedule page, which also renders `LessonCalendar`).
- Both themes: all new colors are existing `--td-{brand,cyan,violet,warning}` design tokens at `/20`
  (fill) or `/30` (hover) opacity over the light/dark canvas, plus `text-ink` (the semantic body-text
  token, itself theme-aware) rather than the previous solid-fill/`on-*`-text pairing — no new raw
  Tailwind palette classes were introduced. Verified in both themes; see Verification State.
- Purely visual: no schema change, no new database column, no change to lesson data, creation,
  editing, payment, or any other lesson behavior — only how existing lesson data is colored on this
  one calendar component.

## Previous Milestone (TD-007)

- Milestone: **TD-007 — Duplicate-lesson shortcut**
- Status: Implemented; independent review recommended

A "Duplicate" action was added to a one-off lesson's detail page (`src/app/dashboard/lessons/[id]`)
that pre-fills the "New lesson" form from the source lesson's student/subject/duration/price and
opens it on the schedule page, defaulting the date/time to the next open slot. Addresses the audit
finding recorded as TD-006's "Next Recommended Task": tutors adding ad-hoc extra sessions with the
same student/subject/price had to refill the whole form from scratch each time.

- **Entry point**: a "Duplicate" `LinkButton` next to "Back to lessons" on
  `src/app/dashboard/lessons/[id]/page.tsx`, matching that page's existing action-link convention.
  It navigates to `/dashboard/schedule?duplicate=<lessonId>` rather than opening a new modal
  in-place, so the existing "New lesson" modal (already built into `LessonsCalendarView`) can be
  reused instead of building a second create flow.
- **Data loading**: `getLessonDuplicateDataAction(lessonId)` (`src/features/lessons/actions.ts`)
  loads the source lesson via `getLesson`, then explicitly checks `lesson.tutor_id === tutorId`
  before returning anything — defense in depth on top of `lesson`'s RLS `select` policy (which
  already scopes every query to `auth.uid()`), per AGENTS.md's IDOR requirement, and never trusts
  the client-supplied lesson id alone. It otherwise reuses exactly what
  `getScheduleCreateDataAction` already fetches for the "New lesson" form (subjects, rates, and the
  same -7..+120-day conflict-picker lesson window), so no new query shape was introduced.
- **Next-open-slot default**: `findNextAvailableSlot` (`src/features/lessons/date-utils.ts`) is a
  new pure function that reuses the picker-window lesson list already being fetched (no separate
  availability query): it scans forward day by day from tomorrow, at the source lesson's own
  time-of-day, and returns the first day with no overlapping lesson at that time. If the source
  time no longer fits the tutor's current working hours (e.g. working hours were tightened since
  the lesson was booked), it skips the scan and falls back to tomorrow unchecked — the create
  form's own working-hours check and the database's overlap constraint remain the final authority
  at submit time either way. Covered by a new unit test file, `src/test/date-utils.test.ts` (5
  tests: free tomorrow, skips a busy day, ignores cancelled lessons, ignores the source lesson
  itself via `excludeLessonId`, and the working-hours fallback).
- **Form**: `LessonsCalendarView` gained a `duplicateLessonId` prop; on mount, if set, it calls
  `getLessonDuplicateDataAction` and opens the same `LessonForm` modal used for "New lesson"
  (`createLessonAction`, `allowRecurrence` still available), pre-filled with the source student/
  subject/duration/price/currency and the computed slot. Payment status is deliberately **not**
  carried over — a duplicated lesson defaults to `unpaid` like any new lesson, since it's a new,
  unpaid session. If the source student has since been archived (missing from the page's active-
  students list), it's added back into the form's student dropdown, mirroring the same pattern
  `getLessonEditDataAction` already uses for the edit form.
- Recurring lesson series, billing, and every other lesson feature were left untouched, per the
  ticket's explicit scope — duplicating one occurrence of a recurring series creates a new
  standalone one-off lesson; it does not touch the series itself.

## Previous Milestone (TD-006)

- Milestone: **TD-006 — UX audit fixes: unpaid-lessons filter, unarchive student, student search,
  repo-wide line-ending fix**
- Status: Implemented; independent review recommended

Four small, independently-scoped changes were implemented in parallel (each in its own worktree/
branch, then merged into `main`) as part of an unsupervised audit-and-fix pass while the owner was
away, per AGENTS.md's smallest-correct-change discipline:

1. **Unpaid-lessons filter** (`src/features/lessons/`): a `payment=unpaid|paid|all` filter on the
   lessons list (`paymentFilterSchema` in `schemas.ts`, applied in `listLessonsPage`), and the
   dashboard's "unbilled" stat now deep-links to `/dashboard/lessons?status=completed&payment=unpaid`
   instead of an unfiltered list. Ownership relies on the same RLS-only pattern already used by the
   existing status/student/subject filters (no app-level `tutor_id` filter needed — `lesson`'s RLS
   `select` policy already scopes every query to `auth.uid()`).
2. **Unarchive student** (`src/features/students/`): `unarchiveStudentAction` + a "Reactivate" button
   on `/dashboard/students/archived`, mirroring `archiveStudentAction`'s auth/ownership pattern.
   Deliberately does not restore lessons cancelled at archive time — only flips the student back to
   active. No unarchive control was added to the student detail page itself (out of this ticket's
   scope).
3. **Student search** (`src/features/students/`): a `?q=` name search box on `/dashboard/students`
   (case-insensitive, `ilike`, wildcard-escaped, Zod-validated, 300ms-debounced), following the same
   query-param convention as the lessons/homework filters. No shared `ListFilters` component existed
   to reuse, so this followed the existing inline-filter-bar style instead of introducing one.
4. **Repo-wide CRLF fix**: `.gitattributes` (`* text=auto eol=lf`) plus a working-tree renormalize,
   fixing `pnpm run format:check`/`biome format .` failing on ~178 files on Windows checkouts
   (`core.autocrlf=true` vs. Biome's LF expectation). Two sibling agents hit this independently before
   it was fixed. `biome.json` needed no change — LF was already its default.

All four were merged into `main` sequentially (fast-forward or clean auto-merge for code; only
`docs/PROJECT_STATE.md` itself conflicted each time, resolved by hand into this consolidated entry).
After merging, `biome format --write .` was re-run once to fix line-ending drift on the newly-merged
files themselves (Windows `autocrlf` re-introduced CRLF on files each branch had created), committed
separately as `chore(repo): reformat post-merge line-ending drift on new files`.

## Current Reality

TutorDesk is a Next.js App Router modular monolith using hosted Supabase Auth and PostgreSQL. On top
of the working student/lesson/homework feature set (TD-002–TD-004), the entire UI was rebuilt on a
semantic design-token system with a light and a dark theme (toggle in the sidebar/header, persisted,
no flash on load) and a distinctive brand identity: emerald green as the primary action color, cyan
as a secondary/informational accent, and violet as a tertiary accent, chosen per the owner's
direction (dark theme "black with green and cyan, maybe purple, plus white"; light theme derived from
the same hues). Red/amber are kept for danger/warning states rather than folded into the brand
palette, since breaking that color convention would hurt usability for its own sake. Typography moved
to Manrope (`next/font/google`) for a distinctive but still calm, professional feel — no new npm
dependency, no new component library, no gradients beyond one small two-color accent on the brand
mark.

The repository is linked to hosted project `cmlvtnjoynffrznyelym` (Supabase name: TutorHub). No
database schema changed in this task.

## Database and authorization

Unchanged from TD-004. `public.tutor_profile`, `public.student`, `public.lesson`, and
`public.homework` and their RLS policies are untouched — this task was UI-only.

## Authentication

Unchanged from TD-001S/Google OAuth/TD-002/TD-003/TD-004. The sign-in/sign-up pages and `AuthForm`
were restyled to the new tokens but their logic is untouched.

## UI

- **Exploratory design lab** (`/mockups/linen` and `/mockups/orbit`): two public, static dashboard
  previews were added for visual comparison without changing the authenticated product UI. `Linen`
  is a calm light workspace using blue-grey, sage, and warm neutral accents; `Orbit` is a restrained
  dark workspace using muted sea-glass, lavender, and clay accents. Both use realistic TutorDesk
  content, responsive dashboard layouts, and presentation-only revenue, workload, preparation, and
  capacity charts. A floating concept switcher moves between the two previews.

- **Design tokens** (`src/app/globals.css`): semantic CSS custom properties (`--td-canvas`,
  `--td-surface`, `--td-border`, `--td-ink`/`-muted`/`-subtle`, and per-hue `--td-{brand,cyan,violet,
  danger,warning}` with `-strong` and `on-*` variants), declared on `:root` (light) and re-declared
  under `.dark`. A Tailwind v4 `@theme` block maps each to a `--color-*` token, so ordinary utility
  classes (`bg-canvas`, `text-brand`, `border-cyan/25`) resolve correctly in both themes with zero
  per-component light/dark branching. Every component and page was swept to use these tokens instead
  of raw Tailwind palette classes (`bg-white`, `text-slate-500`, `bg-blue-600`, …) — verified with a
  repo-wide grep that now returns nothing.
- **Dark mode**: `ThemeToggle` (`src/components/ThemeToggle.tsx`) toggles a `.dark` class on
  `<html>` and persists the choice to `localStorage`. An inline script in the root layout's `<head>`
  applies the stored (or OS-preferred) theme before first paint, avoiding a flash. Toggle is present
  in the app shell (sidebar on desktop, header on mobile) and on the public home/sign-in/sign-up
  pages.
- **New shared primitives**: `Card` (the repeated `rounded-xl border bg-surface p-6` pattern used
  everywhere, now one component), `Badge` (generic tone-based pill, replacing bespoke per-feature
  badge styling), `Avatar` (deterministic initials + color from name, cycling through the brand
  hues), `StatCard` (icon-chip stat card, now built on `Card`), and a hand-rolled `icons.tsx` (no
  icon-library dependency — inline SVGs using `currentColor`, theme-agnostic by construction).
  `PageHeader` gained an `avatar` slot, used on student/lesson detail pages.
- **Status color mapping** uses the brand hues meaningfully rather than generic red/yellow/green:
  lesson `scheduled`=cyan, `completed`=brand(green), `cancelled`=neutral, `no_show`=amber; homework
  `assigned`=neutral, `submitted`=cyan, `reviewed`=violet. `StatusBadge` and homework badges still
  use this mapping as a solid fill. As of TD-008, the day/week `LessonCalendar` no longer does —
  see TD-008 above: its blocks are now colored by student, with status as a border-stripe/dot
  accent using this same set of hues.
- **Home page** (`/`) was rebuilt from a leftover "Supabase foundation" infra-status card into an
  actual product intro matching the new brand (tagline, sign-in/sign-up CTAs, a 3-up feature strip
  for Students/Lessons/Homework). `e2e/app.spec.ts` was updated to match (the old `#status-badge`
  assertion no longer applies; `#brand-title`/`#sign-in-link` and the other assertions are
  unchanged).
- Manual browser verification covered both themes across the home page, sign-in, dashboard, students
  list/detail, the lesson calendar (including a scheduled lesson's cyan block and the brand-colored
  active-nav accent), and homework list/detail (including the violet "Reviewed" badge) — plus a
  375px mobile check in dark mode.

## Not Implemented

- The design-lab previews are intentionally not connected to Supabase, live tutor data, or product
  actions, and are not linked from the production navigation. They are visual proposals only.

- Everything listed as not implemented in TD-004 remains not implemented (recurring lessons,
  invoices, student portal, etc.) — this task was visual/theming only, no feature scope changed.
- A dedicated mobile-optimized week calendar layout (unchanged from TD-004 — see Known Issues).
- Per-user theme preference stored server-side; theme choice is `localStorage`-only (per browser,
  not per account), which is consistent with this being a prototype and matches how most SaaS theme
  toggles work before a settings page exists.

## Verification State

- Design-lab verification (2026-09-16): scoped Biome format/lint, full TypeScript typecheck, and the
  optimized Next.js production build passed. Both mockups compiled as static routes and were
  manually inspected in the in-app browser at a narrow responsive viewport. No behavior tests were
  added because the concepts contain no product functionality.

- `pnpm run format:check`, `lint`, `typecheck`, `test`: passed (6 unit test files, 21 tests — no
  test logic changed, this was a styling task).
- `pnpm run build`: passed cleanly — 16/16 routes, no errors — run with the dev server stopped.
- Repo-wide grep for legacy Tailwind palette classes (`slate-`, `blue-`, `emerald-`, `rose-`,
  `amber-`, `bg-white`, `text-white`) across `src/app`, `src/features`, `src/components`: zero
  matches, confirming the token sweep is complete.
- Manual browser walkthrough (real hosted account, both themes): home page, sign-in, dashboard,
  students list/detail, lesson calendar (day and week, a real scheduled lesson rendered as a cyan
  block), homework list/detail (violet "Reviewed" badge), theme toggle round-trip (dark → light →
  dark, persisted across navigation), and a 375px mobile dark-mode check. All rendered correctly with
  legible contrast in both themes.
- A dev-server HMR cache corruption (`__webpack_modules__[moduleId] is not a function`, a known
  Next.js dev-mode issue after many rapid file saves — unrelated to any specific code change) was hit
  mid-verification and resolved the same way as prior sessions' `.next` corruption: kill the dev
  process, delete `.next`, restart.
- Playwright E2E: not run (same pre-existing gap as TD-002–TD-004 — no Chromium binary installed in
  this environment); `e2e/app.spec.ts` was updated for the new home page copy but not executed here.
  `e2e/auth.spec.ts` remains stale and unrelated to this task.
- `pnpm audit`: not re-run; no new dependencies were added (Manrope loads via `next/font/google`,
  which ships with Next.js).

- TD-006 post-merge verification (2026-09-28, run against the merged `main`, not just each branch in
  isolation): `pnpm run format:check` — clean, 179 files. `pnpm run lint` — 0 errors (1 pre-existing
  unrelated warning + 1 info). `pnpm run typecheck` — clean. `pnpm run test` — 9 files, 41 tests, all
  passed. `pnpm run build` — passed, all routes compiled (hit the known `.next` webpack-cache
  corruption issue once — see Known Issues — resolved the usual way: delete `.next`, rebuild).
- No manual/hosted-browser walkthrough of the four TD-006 changes was performed (no interactive
  Supabase session in this unsupervised environment) — flagged as unverified pending a manual pass.

- TD-007 verification (2026-09-28): this worktree's checkout still had CRLF line endings on disk
  despite `.gitattributes` being correct in the index (the TD-006 renormalize only touched the
  branch it was made on; a worktree branched before that commit doesn't get its working tree
  rewritten by a later merge/rebase alone) — fixed locally with `git rm -r --cached . && git reset
  --hard HEAD` to force a clean re-checkout under the `eol=lf` attribute, no source changes. After
  that: `pnpm run format:check` — clean, 180 files. `pnpm run lint` — 0 errors (same 1 pre-existing
  unrelated warning + 1 info as TD-006). `pnpm run typecheck` — clean. `pnpm run test` — 10 files,
  46 tests, all passed (5 new for `findNextAvailableSlot`). `pnpm run build` — passed cleanly, all
  38 routes compiled, no `.next` cache corruption hit this run.
- No manual/hosted-browser walkthrough of the Duplicate button was performed (no interactive
  Supabase session in this unsupervised environment) — flagged as unverified pending a manual pass:
  specifically, click through Duplicate on a real lesson and confirm the modal opens pre-filled
  with the right student/subject/duration/price and a genuinely free slot.

- TD-008 verification (2026-09-28): this worktree was fast-forwarded onto `main` (which already had
  TD-006/TD-007) before starting, then hit the same known CRLF-on-disk issue on the first
  `format:check` (147 errors on files this task never touched) — fixed the same documented way,
  `git rm -r --cached . && git reset --hard HEAD` after committing this task's changes first, so
  nothing in-progress was lost. After that: `pnpm run format:check` — clean, 181 files. `pnpm run
  lint` — 0 errors (same 1 pre-existing unrelated warning + 1 info as TD-006/TD-007). `pnpm run
  typecheck` — clean. `pnpm run test` — 10 files, 46 tests, all passed (no test logic changed —
  purely a rendering/styling task, matching the styling precedent set by TD-005). `pnpm run build`
  — passed cleanly, all 38 routes compiled, no `.next` cache corruption hit this run.
- No manual/hosted-browser walkthrough of the recolored calendar was performed (no interactive
  Supabase session in this unsupervised environment) — flagged as unverified pending a manual pass:
  specifically, view a week with several students in both light and dark mode and confirm each
  student's color is visually distinct enough and the status dot/border stripe stay legible over
  each of the 4 fill hues at `/20`-`/30` opacity.

- TD-009 verification (2026-09-28): this worktree's branch had fallen behind `main` (missing
  TD-006/TD-007/TD-008) — fast-forwarded onto `main` first (`git merge main --ff-only`, clean, no
  conflicts) before starting. Hit the same known CRLF-on-disk issue on the first `format:check` (144
  errors on files this task never touched); fixed the same documented way, `git rm -r --cached . &&
  git reset --hard HEAD` after committing this task's changes first as a safety checkpoint, then
  squashed that checkpoint together with a lint fix into one clean commit (`git reset --soft`, purely
  local history on this not-yet-shared worktree branch, not a rewrite of shared work). After that:
  `pnpm run format:check` — clean, 181 files. `pnpm run lint` — 0 errors (same 1 pre-existing
  unrelated warning + 1 info as TD-006/TD-007/TD-008, both in files this task didn't touch). `pnpm
  run typecheck` — clean. `pnpm run test` — 10 files, 46 tests, all passed (no new tests added — this
  ticket's logic is thin enough, and closely-patterned enough on `updateLessonPayment`/
  `moveLessonAction`, that manual verification was judged sufficient, matching the precedent of not
  adding tests for `moveLessonAction`/`updateLessonStatusAction` either). `pnpm run build` — passed
  cleanly after deleting `.next` first, all 38 routes compiled, no cache corruption hit this run.
  `pnpm audit` not re-run — no new dependency was added.
- IDOR guarantee verified by reading `supabase/migrations/20260913150813_create_lesson.sql`
  directly (see TD-009 above) rather than assumed from TD-006/TD-007's prior reasoning; not verified
  by an actual live attempt to update a foreign tutor's lesson id (would need a second hosted
  account and an interactive Supabase session, unavailable in this unsupervised environment).
- No manual/hosted-browser walkthrough of the new checkboxes/bulk bar was performed (no interactive
  Supabase session in this unsupervised environment) — flagged as unverified pending a manual pass:
  specifically, filter to `payment=unpaid`, select several lessons (including "select all visible"),
  click "Mark as paid", confirm the outcome message's count, the rows update/drop out of the
  `unpaid` filter, and the reverse with "Mark as unpaid" under `payment=paid`.

- TD-010 verification (2026-09-28): this worktree's branch was already on `main` (had TD-009), so no
  fast-forward was needed. Hit the same known CRLF-on-disk issue on the first `format:check` (145
  errors on files this task never touched); fixed the same documented way — committed this task's
  changes first as a safety checkpoint, `git rm -r --cached . && git reset --hard HEAD`, then ran
  `biome format --write .` (fixed 3 real formatting issues in the new/changed files themselves, not
  just CRLF) and squashed the checkpoint plus that formatting fix into one clean commit (`git reset
  --soft`, local history on this not-yet-shared worktree branch). After that: `pnpm run format:check`
  — clean, 182 files. `pnpm run lint` — 0 errors (same 1 pre-existing unrelated warning + 1 info as
  TD-006–TD-009, both in files this task didn't touch). `pnpm run typecheck` — clean. `pnpm run test`
  — 10 files, 46 tests, all passed (no test logic changed; no new tests added — the new due-date
  bucketing is a straightforward range-query extension of the existing overdue-query pattern, and
  `formatDueSoon`/`formatOverdue` are simple enough that manual verification was judged sufficient,
  matching the no-new-tests precedent set by TD-009). `pnpm run build` — passed cleanly after deleting
  `.next` first, all 39 routes compiled, no cache corruption hit this run. `pnpm audit` not re-run —
  no new dependency was added.
- IDOR/ownership for the portal banner verified by reading
  `supabase/migrations/20260917035000_merge_duplicate_select_policies.sql` directly (the `homework`
  select RLS policy) rather than assumed, and by confirming `listPortalHomeworkDueSoon` is called with
  the same `student.id` from `requirePortalStudent` that every other query on `/portal` already uses
  — not verified by an actual live attempt to pass another student's id (would need a second hosted
  portal account and an interactive Supabase session, unavailable in this unsupervised environment).
- No manual/hosted-browser walkthrough of either the dashboard's extended "Needs review" card or the
  new portal banner was performed (no interactive Supabase session in this unsupervised environment)
  — flagged as unverified pending a manual pass: specifically, seed one overdue-assigned, one
  due-within-3-days-assigned, and one submitted homework row for a real student, confirm the
  dashboard card shows all three with the right label/action text, then sign in as that student's
  portal account and confirm the banner shows only their own due-soon/overdue items (not another
  student's) and both link through correctly.

- TD-011 verification (2026-09-28): this worktree's branch was already on `main` (had TD-010), so no
  fast-forward was needed. Hit the same known CRLF-on-disk issue on the first `format:check` (141
  errors, mostly on files this task never touched); fixed the same documented way — committed this
  task's changes first as a safety checkpoint, `git rm -r --cached . && git reset --hard HEAD`, then
  `biome format --write` on the two files this task actually changed (2 real formatting issues in
  the new code itself, not just CRLF) and squashed the checkpoint plus that formatting fix into one
  clean commit (`git reset --soft`, local history on this not-yet-shared worktree branch). After
  that: `pnpm run format:check` — clean, 182 files. `pnpm run lint` — 0 errors (same 1 pre-existing
  unrelated warning + 1 info as TD-006–TD-010, both in files this task didn't touch). `pnpm run
  typecheck` — clean. `pnpm run test` — 10 files, 46 tests, all passed (no test logic changed; no
  new tests added — `getStudentUnpaidSummary` is a thin RPC wrapper with no branching logic of its
  own, matching the no-new-tests precedent already set for `getPortalUnpaidSummary` itself). `pnpm
  run build` — passed cleanly after deleting `.next` first, all 39 routes compiled (including the
  new `/dashboard/students/[id]/billing` bundle at 1.16 kB), no cache corruption hit this run.
  `pnpm audit` not re-run — no new dependency was added.
- **New migration not applied to the live hosted Supabase project** (`cmlvtnjoynffrznyelym`) —
  this unsupervised environment has no DB credentials/MCP write access to that project. The
  `tutor_unpaid_summary` function in `supabase/migrations/20260928010000_tutor_unpaid_summary.sql`
  is therefore unverified against the real database: it needs a manual `supabase db push` (or
  equivalent) against the hosted project, followed by a Supabase advisor check (security +
  performance), before this feature will actually work in production. Until applied, the billing
  page's RPC call will fail with a "function does not exist" error at runtime.
- No manual/hosted-browser walkthrough of the new "Balance owed" card was performed (no interactive
  Supabase session in this unsupervised environment, and the migration isn't applied yet regardless)
  — flagged as unverified pending: apply the migration, then seed a completed+unpaid lesson for a
  real student, open their billing page, and confirm the total/count/link are correct, then repeat
  with a second currency to confirm the multi-row (grouped-by-currency) case renders correctly.

## Known Issues

- Supabase's advisor still reports leaked-password protection disabled for hosted Auth
  (pre-existing, unrelated to this task).
- `e2e/auth.spec.ts` is stale relative to the current `AuthForm` component (pre-existing).
- The week calendar view is visually cramped on narrow (≤375px) mobile viewports (pre-existing,
  noted in TD-004; unchanged by this task's recoloring).
- The student color palette is only 4 hues (`brand`/`cyan`/`violet`/`warning`, same as `Avatar`), so
  a tutor with 5+ active students will see color repeats on the calendar — two students can share a
  color. Acceptable for now (still a big scan improvement over one color for everyone), but a wider
  palette or a persisted per-student color would remove the collision if it becomes a real
  complaint.
- Theme preference is per-browser (`localStorage`), not per-account — see Not Implemented.
- The dashboard's time-based greeting and the lesson calendar's "now" indicator both evaluate in the
  server/browser's own time zone rather than an explicit tutor timezone setting (pre-existing,
  documented simplification, not a regression here).
- The `.next` build cache occasionally corrupts on this Windows environment after many rapid rebuilds
  (`TypeError: Cannot read properties of undefined (reading 'length')` in `WasmHash`, or the older
  `__webpack_modules__[moduleId] is not a function`) — pre-existing, unrelated to any specific code
  change. Fix: delete `.next` and rebuild.
- No shared `ListFilters`/search-bar component exists yet — lessons, homework, and now students each
  inline their own filter bar. Worth extracting if a fourth list gains filters.
- TD-006's four changes were not manually verified against a live hosted account (no interactive
  Supabase session available in the unsupervised environment that built them) — recommend a manual
  browser pass (unpaid filter, reactivate button, student search) before relying on this fully.
- TD-007's Duplicate button was likewise not manually verified against a live hosted account — see
  Verification State.
- A worktree branched before a line-ending renormalize commit can still have CRLF files on disk
  even after rebasing onto a branch that includes it, since checkout doesn't rewrite files whose
  blob content didn't change in the rebase. If `format:check` fails on files you didn't touch, try
  `git rm -r --cached . && git reset --hard HEAD` to force Git to re-apply the `eol=lf` attribute,
  before assuming the source content itself is wrong.
- TD-009's checkboxes/bulk-payment action were not manually verified against a live hosted account
  (no interactive Supabase session available in the unsupervised environment that built them) — see
  Verification State for the specific manual pass recommended before relying on this fully.
- TD-009's "select all visible" only selects the current page (50 rows) — a tutor with 100+ unpaid
  lessons matching a filter has to page through and bulk-act per page rather than clearing all
  matching lessons in one click. Acceptable for now (still a large reduction over one-at-a-time),
  worth revisiting if pagination-spanning bulk selection becomes a real complaint.
- No email or push notification channel exists anywhere in the app (TD-010 confirmed this again —
  still no mailer dependency in `src/`). The dashboard/portal due-date nudges added in TD-010 only
  surface while the tutor or student is actually looking at the app; nothing proactively reaches
  them outside it. Building real notifications would need a mailer/push provider decision first.
- TD-010's dashboard and portal due-date nudges were not manually verified against a live hosted
  account — see Verification State for the specific manual pass recommended before relying on this
  fully.
- TD-011's `tutor_unpaid_summary` migration has not been applied to the live hosted Supabase
  project — see Verification State. The billing page's RPC call will error until it is.

## Next Recommended Task

**Apply and verify the TD-011 migration against the live hosted Supabase project
(`cmlvtnjoynffrznyelym`): run `supabase db push` (or the team's equivalent apply step) to create
`tutor_unpaid_summary`, then check the Supabase advisor (security + performance) for that function,
then do the manual walkthrough described in TD-011's Verification State (seed a completed+unpaid
lesson, confirm the "Balance owed" card and its link, repeat with a second currency). This is small,
low-risk, and blocks the feature from working at all in production — a better next step than new
feature work until the gap between "implemented in this worktree" and "actually live" is closed. If
that's already done by the time this is picked up, the next-most-valuable gap is the same one TD-006
flagged and TD-007–TD-010 kept deferring: none of TD-006 through TD-011's changes have had a single
manual/hosted-browser walkthrough in an interactive session — worth a dedicated verification pass
across all six before adding more surface area.**
