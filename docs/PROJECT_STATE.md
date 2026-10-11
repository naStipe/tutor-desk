# TutorDesk Project State

## Current Milestone

- Milestone: **TD-022 — Different payer, live lesson status, prepaid lesson packages**
- Status: Implemented and verified locally (format, lint, typecheck, 153 tests, build). **The migration
  `supabase/migrations/20261011000000_lesson_packages.sql` is written but NOT applied** to the hosted project, and
  `database.types.ts` was edited by hand to match. Until it is applied: the package card is hidden (its query is
  caught), package sync and auto-complete calls fail silently (wrapped in try/catch), but the lessons queries that
  now select `lesson.package_id` will error, so **apply the migration before deploying this code**.
- Last updated: 2026-10-11
- Uncommitted work was committed at the end of this session (see git log).

- **Different payer** (`StudentForm.tsx`): new student form has a checkbox "Someone else pays or is responsible
  (different payer)" that reveals the existing guardian fields. On an existing student (Contacts tab) an "Add payer /
  responsible person" button reveals them and "Remove" hides them; saving with the section hidden clears the
  guardian columns. `fields()` in `students/actions.ts` now maps missing guardian inputs to `""` (they are not
  rendered when hidden). No schema change (the guardian columns already existed).
- **Live lesson status** (`lessons/status.ts`, `StatusBadge`, calendars): `in_progress` is a *derived display
  status*, never stored. `displayStatus()` shows a scheduled lesson as "In progress" between start and end and as
  "Completed" after the end. `StatusBadge` takes optional `startTime`/`endTime`, ticks every 30 s and shows the
  stored status until mounted (no hydration mismatch). `LessonCalendar` and `StudentLessonCalendar` use it (new
  violet glyph `◐`, legend entry). The stored value catches up through `complete_elapsed_lessons()`, called on every
  dashboard layout render (own lessons only, RLS applies, errors swallowed). Portal/student-view lists use the badge
  with times; a portal's stored status is only as fresh as the tutor's last dashboard visit.
- **Lesson packages** (`src/features/packages/`, billing tab "Lesson packages"): a tutor records that a student bought
  N lessons (optional price/currency/note). Balance is derived, not stored: *booked* = covered lessons still
  scheduled, *used* = covered lessons completed or no-show, *remaining* = total − booked − used. SQL
  `sync_student_package_credits(student)` (security invoker, advisory lock per student) releases credits of cancelled
  lessons (unpaid again) and then covers the earliest uncovered scheduled+unpaid lessons from the oldest package with
  room, marking them paid with `package_id` set. It runs after: lesson create, edit, status change, series cancel,
  recurring generation, student archive, package add/delete. Deleting a package returns its still-scheduled lessons to
  unpaid; held lessons stay paid. No-shows consume a credit (decision; easy to change in the SQL and `balance.ts`).
  Marking a package lesson unpaid by hand (single, bulk, or edit form) detaches it from the package; changing a
  lesson's student does too.
- **Security**: `lesson_package` has RLS (select/insert/delete own; insert requires the student to belong to the tutor).
  `lesson` gets a composite FK `(package_id, student_id)` → `lesson_package(id, student_id)`, so a forged package id of
  another student or tutor is rejected by the database; `ON DELETE SET NULL (package_id)` needs Postgres 15+. Actions use
  `requireTutorId`, Zod (`packageInputSchema`) and never take a tutor id from the client.
- **Tests**: `src/test/packages-and-status.test.ts` (displayStatus, balance, schema) and two new
  `week-agenda.test.tsx` cases. **Not tested**: the SQL functions and policies (never run on Postgres), the server
  actions, the layout sweep, the billing card against real data. Visual check only of the payer toggle and badges on a
  temporary fixture page at 375px (removed).
- **Known limits**: the credit sync only covers lessons that are scheduled and unpaid; a package bought after lessons
  were already completed does not pay them. A package does not expire. The email reminder and unpaid-balance logic still
  read `payment_status`, so package lessons count as paid there, which is intended.

## Previous Milestone (TD-020)

- Milestone: **TD-020 — Email via Resend (built, NOT activated)**
- Status: Implemented and verified locally (format, lint, typecheck, 141 tests, build). **Nothing sent, nothing
  applied**: the migration is not applied to the hosted project, no `vercel.json` cron exists, and the master
  switch defaults to off. Uncommitted at the time of writing.
- Last updated: 2026-10-10
- Owner decision: Resend (ADR-015). Auth emails go through Supabase custom SMTP (dashboard, owner-configured);
  app emails use Resend's REST API via `fetch` (no new dependency; one endpoint does not justify the SDK).

- **Part A, auth emails**: confirmation and recovery were **already implemented** (`/forgot-password`,
  `/reset-password`, `signUpAction`, `requestPasswordResetAction`, `updatePasswordAction`, `/auth/confirm`
  handling `code` and `token_hash`, `next=/reset-password`), so nothing was rebuilt. Only `docs/EMAIL_SETUP.md`
  was written (Resend domain/SPF/DKIM, API key, Supabase SMTP `smtp.resend.com:465` user `resend`, Site URL and
  redirect allow-list, activation checklist, exact cron entry). No Supabase setting was touched.
- **Part B, app emails** (`src/features/notifications/`, `src/lib/supabase/admin.ts`,
  `src/app/api/cron/lesson-reminders/route.ts`): lesson reminder (cron, window `(now, now+24h]`, max 40 per
  run, student email else guardian email, `skipped`/`no_email` logged, 429 stops the run and releases the
  claim, other errors mark one lesson `failed`) and unpaid-balance reminder (button "Email payment reminder" on
  `/dashboard/students/[id]/billing`, shown only with switch + credentials on, a balance, and a guardian/student
  email; `ConfirmModal`, inline `role="alert"/"status"`, generic errors, one send per student per hour).
  Env vars (all in `.env.example`): `EMAIL_NOTIFICATIONS_ENABLED`, `RESEND_API_KEY`, `EMAIL_FROM`,
  `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`. With the switch off the cron returns `{"disabled":true}` (after
  the 401 check) and the button is hidden, so existing behavior is unchanged.
- **Schema (written, NOT applied)**: `supabase/migrations/20261010000000_notification_log.sql` adds
  `public.notification_log` (RLS, tutor select-own only, unique `(kind, lesson_id)`) and two service-role-only
  functions, `due_lesson_reminders` and `claim_balance_reminder`. `src/lib/supabase/database.types.ts` was
  edited by hand so the typed client compiles; `pnpm run db:types:check` will fail against the hosted project
  until the migration is applied and `pnpm run db:types` is rerun (not run: it needs the hosted project).
- **Security**: first RLS-bypassing path; safeguards listed in `docs/SECURITY.md` (service-role-only SQL
  function, constant-time cron secret, no user input in the cron path, ownership re-check and advisory-lock
  rate limit on the manual action, escaped templates, masked log).
- **Tests**: `src/test/notifications.test.ts` (21 new, node env): switch/config, cron secret, cron handler
  401/disabled/run, window tiling, escaping and header-injection, tutor-timezone formatting, URL scheme,
  Resend request shape and 429/error mapping with `fetch` mocked. The orchestration (`send-lesson-reminders`),
  the SQL functions and the server action are **not** unit-tested (they need Supabase).
- **Verified**: `format:check`, `lint` (0 errors; same pre-existing 1 warning + 1 info in `src/app/portal`),
  `typecheck`, `test` (141 passed, 18 files), `build` pass. In the dev server: `/forgot-password` renders at
  375x812; the cron route returns 401 without/with a wrong bearer; the balance button, confirm sheet and
  success alert were checked at 375x812 and desktop with a temporary fixture copy of the component and a mocked
  action (fixture deleted). `pnpm audit`: same 8 advisories (4 high, 4 moderate) in `next`/`postcss`/etc.; no
  new dependency.
- **Not verified**: real Resend delivery, Resend domain/DKIM, Supabase custom SMTP and the auth emails, the
  migration and SQL functions on a real database (not even syntax-checked by Postgres), the cron on Vercel,
  the real billing page button (needs auth and a hosted student with an email), `/reset-password` end-to-end.
  Minor: `ConfirmModal` styles the confirm button as `danger` (red) for this non-destructive action.

## Previous Milestone (TD-019)

- Milestone: **TD-019 — Component/render tests and refreshed auth e2e spec**
- Status: Implemented; **e2e spec written but never executed** (Playwright browser download failed)
- Branch: `main` (committed as f5f0ff3)
- Last updated: 2026-10-10
- TD-021 (docs only, after this): `docs/ARCHITECTURE.md` and the Manrope mentions in this file now say
  Space Grotesk + JetBrains Mono (`src/app/layout.tsx`); historical entries are marked superseded.

No schema, server-action or runtime-behavior change except one real bug fix in `Select` (below).

- **Dev dependencies added** (devDependencies only, no force flags): `jsdom` 30.1.2 (DOM for vitest; optional
  peer `canvas` not installed), `@testing-library/react` 16.3.3 (peers react/react-dom 18 || 19, fine on
  React 19), `@testing-library/dom` 10.4.2 (required peer of RTL), `@testing-library/user-event` 14.6.7.
  `@testing-library/jest-dom` was skipped on purpose (plain DOM assertions suffice). `pnpm audit`: 8
  advisories (4 high, 4 moderate), all in `next` (<15.5.27), `postcss`, `source-map-js`, `sharp`, reached via
  `next` / `@vercel/speed-insights`; none in the new packages. They are not fixed here (no `audit --fix`).
  `pnpm-lock.yaml` changed (vitest peer variant now includes jsdom).
- **Setup**: tests opt into jsdom per file with `// @vitest-environment jsdom`; the default stays `node`, so
  the 13 old pure test files are unchanged. `vitest.config.ts` gained `esbuild: { jsx: "automatic" }`
  (tsconfig uses `jsx: preserve`, so TSX tests failed with "React is not defined"). `src/test/dom-helpers.ts`
  provides a test-local `matchMedia` (reduced motion on, coarse pointer / phone width switchable) and
  `HTMLDialogElement.showModal/show/close` polyfills. Server actions and `next/navigation` are mocked in the
  LessonsListView test; Supabase is never reached.
- **New tests (48)**: `select.test.tsx` (custom listbox vs native `<select>` on coarse pointer, keyboard,
  disabled option, hidden input, placeholder), `modal.test.tsx` (Modal open/close, close button, backdrop,
  native close event for Esc, sheet/centered class contract; ConfirmModal labels, confirm/cancel, disabled),
  `week-agenda.test.tsx` (7 days, today pill in tutor zone, lessons, status text, ordering, zone bucketing,
  hrefs), `lessons-list-view.test.tsx` (rows/cards, pagination via router, selection, bulk action ids,
  returned/thrown error alerts, "Select all N matching" banner, mode switch and drop, confirm modal, cancel,
  filter-action payload and count, failure keeps mode).
- **jsdom limits**: Tailwind/media queries are not evaluated, so sheet-vs-centered is checked as a class
  contract only; real Esc handling, focus trap, backdrop rendering, `motion` animations (skipped via reduced
  motion) and `(pointer: coarse)` on real devices are not covered. The table and the phone card list both
  render in jsdom (CSS hides one).
- **Bug found and fixed**: in `Select.tsx` the custom listbox relied on `autoFocus` on a `<div>`, which React
  ignores, so focus stayed on the trigger and ArrowUp/Down/Enter could never choose an option. The open
  effect now focuses the listbox, and commit/Escape return focus to the trigger (`triggerRef`). Covered by the
  keyboard test. Verified in jsdom only, not in a real browser.
- **`e2e/auth.spec.ts` rewritten** for the current UI (ids/copy were stale: `#signup-*`, "Create Tutor
  Account", a name field and session cards no longer exist). It now checks the home links, sign-in / sign-up
  forms, Zod field errors ("Enter a valid email address", "Password is required", "Password must be at least
  8 characters") and navigation between the two pages. The register/sign-out/sign-in round trip was removed
  (needs a hosted project without email confirmation and created a real user per run; `test:auth:hosted`
  covers hosted auth). Every submit fails validation before any Supabase call; no credentials used.
  **Not executed**: `pnpm run test:e2e:install` failed ("Failed to download Chrome Headless Shell"), so the
  spec is only typechecked and Biome-clean. `e2e/app.spec.ts` is also stale (expects heading "Tutor sign
  in", the real one is "Sign in"); not touched, out of scope.
- Verification: `format:check`, `lint` (0 errors, same 1 warning + 1 info), `typecheck`, `test` (120 passed in
  17 files; 72 before, 48 new), `build` pass (`.next` removed after).

## Previous Milestone (TD-018)

- Milestone: **TD-018 — Accessibility pass (non-color cues, minimum text size, contrast)**
- Status: Implemented; **not verified with a screen reader, on a real phone or against the hosted account**
- Branch: `main` (uncommitted)
- Last updated: 2026-10-10

Presentation/markup only. No schema, data-layer, server-action or dependency change.

- **Status by color only** (added a non-color cue; student-color choice from TD-016 untouched):
  `LessonCalendar` blocks now start with a per-status glyph (scheduled `○`, completed `✓`, cancelled `⊘`,
  no-show `!`, replacing the color-only dot), the second line reads "N min · Status", and the button has an
  `aria-label` "9:00 AM to 10:00 AM, Student, Status". `STATUS_DOT_CLASSES` was removed; `STATUS_GLYPHS` and
  `STATUS_TEXT_CLASSES` are exported and used by `CalendarLegend`. `StudentLessonCalendar` blocks get the
  same glyph, status line and sr-only status. Homework-due vs review/feedback count pills are now distinct
  by shape (square vs round with a ring) and carry sr-only text, in `LessonCalendar`, `StudentLessonCalendar`
  and `MonthCalendar` (which also distinguishes the lesson count and has sr-only labels); `CalendarLegend`
  mirrors the shapes. Today's column header gets a 2px brand underline, `aria-current="date"` and sr-only
  "(today)"; `MonthCalendar` day buttons get `aria-current`/`aria-pressed`. `TimeSlotGrid` booked slots show
  `✕`, too-close slots `!`, with sr-only text and legend glyphs. `StatusBadge`, `PaymentBadge`, `Badge` and
  the homework badges already carry text (verified). Past-day weekday labels and past dates used `/70` opacity
  (failed contrast); now full `ink-subtle`.
- **Tiny text**: every `text-[8..11px]` and `text-[10.5px]`/`[8.5px]` in `src` is now `text-xs` (12px),
  including dashboard eyebrows, week labels, donut/heatmap labels, schedule pills, student hours, shell nav
  badges, bottom-tab labels, calendar gutters and count pills. Heatmap `W1..W8` and weekday letters are
  `aria-hidden` (a visually hidden `<table>` carries the data); alternate week labels hide below `sm` so 8
  labels fit at 375px. Hours trend, donut and per-student sparklines have data-bearing `aria-label`s (before:
  generic). Decorative swatches are `aria-hidden`. `MonthCalendar` pills use `px-1`/`gap-0.5` so they stay
  within the 375px cell.
- **Contrast** (WCAG ratios computed from the tokens; table below). Token changes in `globals.css`, light
  theme unless noted: `--td2-text-muted` `#737b74`→`#5f665f`; `--td2-text-faint` `#8f958e`→`#666d66`
  (dark `#6c7471`→`#808885`); `--td2-text-disabled` `#a5aba3`→`#666d66` (dark `#4a514e`→`#808885`; it was
  used for informative sidebar text, and the usages now use `text-faint`); `--td2-cyan` `#0891b2`→`#0b6680`,
  `-strong` `#0e7490`→`#0a5468`; `--td2-violet` `#7c3aed`→`#6d28d9`, `-strong` `#6d28d9`→`#5b21b6`;
  `--td2-danger` `#dc2626`→`#b91c1c`, `-strong` `#b91c1c`→`#991b1b`; `--td2-warning` `#b45309`→`#92400e`,
  `-strong` `#92400e`→`#78350f`. Hues stay emerald/cyan/violet; light accents are darker shades. New small
  `src/test/contrast.test.ts` guards body text, accent-on-card/page and `on-*`-on-accent pairs (4.5:1) in both
  themes.
  Before (failing, normal text 4.5:1): light `ink-subtle` 3.71-4.16, `faint` 2.60-2.92, `disabled` 1.99-2.24,
  `cyan` on surface 3.51, `danger` on page 4.10, `warning` on page 4.27, `on-cyan` on cyan 3.68, cyan text on
  its 10-20% tints 2.5-3.1, violet/danger/warning text on 15-20% tints 3.0-4.4; dark `faint` 3.55-4.10,
  `disabled` 2.1-2.4. After: all of those pass.
  **Still below threshold, left on purpose:** light `danger` text on `danger/20` (4.38 on card, only the
  danger button hover), `danger/15` and `danger/20` on page (4.30/3.95), `violet/20` on page (4.37),
  `warning/20` on page (4.46) and `cyan/20` on page (4.15) - these tints appear on cards (where they pass,
  4.60+) or only on hover; `hue-lime` fill vs page 2.63:1 (student color, TD-016 scope; text on it is
  `ink`); `MonthCalendar` out-of-month dates (`ink-subtle/40`, intentionally dim, inactive);
  **form-field and card borders** (`border` 1.17-1.26:1, `border-strong` 1.38-1.40:1 on surface, below the
  3:1 UI-component guideline in both themes). Fixing borders changes the whole look, so it needs a design
  decision.
- **Focus and touch targets**: `Modal` close button measured 40px; now `p-3` (44x44 below `sm`, verified).
  `ConfirmModal` buttons 48px (verified); `Button`/`LinkButton` (quick action row, confirm) have a
  `focus-visible` 2px brand outline and `min-h-11`; no `outline-none` exists in `src`; the `Modal` close
  button relies on the browser default focus ring. `Field` inputs show a brand border plus a 25% outline on
  focus.
- Verification: `format:check`, `lint` (0 errors, same 1 warning + 1 info), `typecheck`, `test` (72 passed, 6
  new in `contrast.test.ts`), `build` pass (`.next` removed). In the in-app browser on a temporary public
  fixture route (removed) at 375x812 and ~1024 wide, light and dark: the calendar blocks, legend, pills,
  month grid, dashboard cards and confirm sheet render with the glyphs; no horizontal overflow at 375px;
  no computed font size under 12px outside `sr-only`; close button 44x44. This caught a bug in my own first
  version (an `sr-only` `<table>` widened the page; wrapped in an `sr-only` div).
  **Not verified:** screen readers (VoiceOver/TalkBack/NVDA: labels written, never announced), real phone,
  hosted/authenticated pages (the production `LessonsCalendarView`, lessons list, `WeekAgenda` and
  `TimeSlotGrid` were not rendered; changes there are class swaps or sr-only text), keyboard-only
  walkthrough, the `ConfirmModal` focus ring visually, Windows high-contrast mode, `prefers-contrast`.

## Previous Milestone (TD-017)

- Milestone: **TD-017 — "Select all N matching" bulk payment across pages (lessons list)**
- Status: Implemented; **server action not verified against the hosted database or a real phone**
- Branch: `main` (uncommitted)
- Last updated: 2026-10-10

No schema change, migration or new dependency. One new server action.

- **Flow** (`LessonsListView.tsx`): once the header/"Select all on this page" checkbox selects every row
  and `totalCount` exceeds the page, the bulk bar shows "All 50 lessons on this page are selected.
  [Select all N matching]" (44px tall on phones). Choosing it changes the bar to "All N matching lessons
  selected" with the same Mark paid / Mark unpaid / Clear selection buttons. Mark paid/unpaid then opens
  `ConfirmModal` stating the count ("Mark N lessons paid?", mentions other pages and that rows already in
  that status are left alone). Success shows the neutral status line, clears the selection and refreshes;
  failures use the TD-015 inline `role="alert"` with generic text and keep the selection.
- **Tied to the exact list**: the mode is stored as `{ key, count }`; `key` (`listSelectionKey`) is
  status, student, subject, payment, sort key, sort dir and page size. It is active only while the key
  equals the current props, so browser back/forward or any filter/sort change also drops it (plus
  `pushParams` resets it explicitly). Toggling any single row or the header checkbox leaves the mode.
  The page number is not part of the key (the matching set does not depend on it); `pushParams` still
  clears selection on page change.
- **New action** `bulkSetLessonPaymentForFilterAction(filters, paymentStatus, expectedCount)`: the client
  sends the list filters in URL-param shape, not ids. Zod (`bulkPaymentAllMatchingSchema`) checks the shape;
  `requireTutorId`; then `bulkUpdateLessonPaymentByFilter` (data.ts) counts matching rows (explicit
  `tutor_id` filter + RLS), returns an error without writing if the count exceeds
  `MAX_BULK_ALL_MATCHING` (2000) or differs from the count the tutor confirmed (stale list), otherwise
  updates `payment_status`/`paid_at`/`updated_at` (same field pattern as `bulkUpdateLessonPayment`;
  `payment_method` untouched) and returns `updatedCount` and `matchedCount`. Thrown database errors become
  "Couldn't update the lessons. Try again."; raw DB text is never returned.
- **One filter parser**: new `parseLessonListFilters` (`schemas.ts`) is used by the lessons page and the
  action, and a shared `applyLessonListFilters` (data.ts) by both `listLessonsPage` and the bulk update, so
  what is listed and what is updated cannot drift. Behavior change on the page: `student`/`subject` params
  that are not UUIDs are now ignored (before they were passed to the query and errored).
- **Decisions**: (1) rows already in the target status are skipped (`.neq("payment_status", target)`) so
  an existing `paid_at` is not overwritten when the filter includes both; the message reports e.g. "100
  lessons marked paid. 30 already paid." (the single-id bulk action from TD-009 still overwrites). (2) the
  expected-count guard instead of trusting the filter alone: if rows were added/changed since the page
  loaded, nothing is written and the tutor reloads. Count and update are two statements, not a
  transaction, so a change between them can still make the update differ slightly from the count (still
  only the tutor's own rows matching the filter). (3) the 200-id cap on `bulkSetLessonPaymentAction` is
  unchanged.
- **IDOR / cross-tenant**: no client-supplied lesson ids exist in this path. The only client inputs are
  filter strings, a status enum and a number. Rows are selected server-side with `tutor_id =
  auth user id` (from `requireTutorId`, never from the client) and `lesson`'s RLS update/select policy
  (`auth.uid() = tutor_id`, read in `20260913150813_create_lesson.sql` for TD-009) independently. A
  foreign student/subject id in the filters just matches zero of the tutor's rows (count 0 fails the
  `expectedCount >= 1` check or the stale check). A forged huge `expectedCount` cannot widen anything: it
  must equal the tutor's own live match count. Worst case a tutor updates their own matching lessons.
- Verification: `format:check`, `lint` (0 errors, same 1 warning + 1 info), `typecheck`, `test` (66
  passed, 7 new in `src/test/bulk-selection.test.ts`: offer rule, selection key, filter parser, action
  schema/cap, message), `build` pass (`.next` removed first). In the in-app browser on a temporary
  public fixture route (removed; `fetch` for server actions mocked, so the real action did not run): at
  1024 wide the banner appeared only with all 50 selected, the link switched the bar to "All 130 matching
  lessons selected", Mark paid opened the confirm modal, confirming sent `{status, payment}`, `paid`,
  `130` and showed the success line; at 375x812 the link is 44px high, confirm button 48px, no horizontal
  overflow, a rejected request showed the alert and kept the mode, deselecting one row dropped the mode
  and the banner. **Not verified:** the action and queries against the real database (count/update
  syntax is type-checked only; the `head: true` count combined with `.eq`/`.neq` filters, RLS
  behavior, the 2000 cap and stale paths); a real phone; the confirm modal's exit animation after the
  last text fix was not re-viewed; page-size changes (there is no UI to change `pageSize`).

## Previous Milestone (TD-016)

- Milestone: **TD-016 — Calendar polish (student colors, locale week start, tutor-timezone "now")**
- Status: Implemented; **not verified against the hosted account or a real phone**
- Branch: `main` (uncommitted)
- Last updated: 2026-10-10

No schema change, migration, new dependency, server action or authorization change.

- **Student colors**: `src/lib/color.ts` gains an 8-hue `STUDENT_HUES` palette (brand, blue, violet,
  pink, orange, warning, lime, cyan), `studentHue(id)` and `assignStudentHues(ids)`. The last hashes each
  id to a start hue (same hash as before) and linearly probes to the next free hue, ids processed in
  sorted order, so up to 8 students shown together are all distinct, independent of input order, with
  nothing stored. Hues repeat only beyond 8. Trade-off: a student's color depends on the set of
  students (active `students` prop plus any lesson student ids), so adding/archiving a student can
  shift a colliding student's color; a plain per-id hash would be stable but, for 5 students, collides
  about 80% of the time. `LessonCalendar` uses it. Four new design tokens `--td2-hue-{blue,pink,orange,lime}`
  in `globals.css` (light and `.dark`) mapped to `--color-hue-*` in `@theme`; blocks use `bg-hue-*/20`
  with `text-ink`, status stripe and dot unchanged. `hashToHue`/`BRAND_HUES` and `Avatar` untouched.
  `CalendarLegend` does not list student colors, so it is unchanged.
- **Week start**: `firstDayOfWeek(locale)` (`date-utils.ts`) reads `Intl.Locale#getWeekInfo()` (or the
  older `weekInfo`), converted to `Date#getDay` numbering, Monday on a missing/invalid locale or no
  support. `startOfWeek(date, weekStartsOn = 1)` takes an optional first day (default unchanged, so every
  other caller still gets Monday). `MonthCalendar` uses both for its grid offset and `weekdayLabels()`
  for locale-formatted short headers (replacing the hard-coded English "Mo..Su"; now e.g. "Sun/Mon" or
  "пн/вт").
- **Tutor timezone "now"**: new pure `dayRelativeToToday(dateParam, now, timeZone)`. `LessonCalendar`
  (header and column today/past, past overlay, now-line, initial scroll via `minutesSinceMidnightInZone`),
  `MonthCalendar` (today/past) and `WeekAgenda` (today) now use it. The once-a-minute refresh in
  `LessonCalendar` is kept. `MonthCalendar` and `WeekAgenda` still read the clock once per render/mount
  (no timer; "today" only changes at midnight).
- **Found, not fixed (out of scope)**: (1) the server schedule pages (`dashboard/schedule`,
  `student-view/schedule`, `portal/schedule`) and `dashboard/data.ts` still use Monday weeks for the week
  view range, `formatWeekRange` and the month fetch range. For a Sunday/Saturday-first locale the month
  grid can start 1-2 days before the fetched range, so leading out-of-month days may show no lesson
  count. (2) `LessonCalendar` assigns lessons to day columns with browser-local `isSameDay`, while
  `WeekAgenda` uses the tutor zone; they disagree when browser and tutor zones differ. (3)
  `StudentLessonCalendar`, `TimeSlotGrid`, `LessonForm` min dates, `LessonsCalendarView` "Schedule lesson"
  default date, `NextLessonCard` and the dashboard still use the browser clock. (4) `DatePicker` and
  `LessonDateTimePicker` render `MonthCalendar`; they now follow the locale/timezone only if they pass
  `locale`/`timeZone` (not checked).
- Verification: `format:check`, `lint` (0 errors, same 1 warning + 1 info), `typecheck`, `test` (59 passed,
  13 new in `color.test.ts` and `date-utils.test.ts`), `build` pass (`.next` removed first). In the in-app
  browser, on a temporary public fixture route (removed) with the tutor timezone set to Pacific/Auckland
  while the browser was on Oct 10 (NZ already Oct 11): week grid and `WeekAgenda` marked Sunday Oct 11 as
  today and earlier days as past; `MonthCalendar` showed Sun-first for `en-US`, Mon-first for `en-GB`,
  `ru-RU` ("пн..вс") and with no locale, with the grid offset and today ring matching; 8 students
  rendered 8 distinct fills, legible in light and dark at 1280 and 375 wide, no horizontal page overflow.
  **Not verified:** any hosted/authenticated page or real data; real phone; the once-a-minute refresh
  crossing midnight; runtimes without `getWeekInfo`/`weekInfo` (fallback only unit-tested through invalid
  locales); contrast measured by eye, not by tool.

## Previous Milestone (TD-015)

- Milestone: **TD-015 — Visible error handling for client-called server actions**
- Status: Implemented; **not verified against the hosted account or a real phone**
- Last updated: 2026-10-10

Presentation/error-path only; no schema, validation, `requireTutorId`, RLS or ownership change, no new
action, no new dependency. Same inline alert styling as `LessonForm` (`role="alert"`,
`border-danger/25 bg-danger/10 text-danger`); no toast.

- **`LessonStatusActions`**: `runStatus` now has a `catch`; it shows "Couldn't update the lesson. Try
  again." above the Status card (visible on phone and desktop) and clears the message at the start of
  the next attempt. The optimistic status reverts on its own: `setStatus` is only called on success, so
  `useOptimistic` falls back to the last confirmed status when the transition ends (confirmed in the
  browser). The thrown message (may contain Supabase text) is not shown.
- **Phone "Mark paid / Mark unpaid"**: decision: needs a wrapper. A bare `<form action=
  {setLessonPaymentAction}>` sends a thrown error to `src/app/dashboard/error.tsx`, replacing the whole
  lesson page. It now uses a small local `submitPayment(formData)` that awaits the same action in
  try/catch and shows "Couldn't update the payment. Try again." in the same alert. `setLessonPaymentAction`
  is unchanged (the desktop Payment card still uses it directly); success still ends in its `redirect()`.
- **`LessonsListView` bulk payment**: the returned `error` was previously shown as neutral grey text,
  identical to success, and a thrown exception was unhandled. Failures now use a separate `bulkError`
  state rendered as a danger alert; success stays neutral and is `role="status"`. Both a returned error
  and a thrown error keep the selection (it is only cleared on success or when filters/page change).
  Messages reset at the start of the next attempt.
- **`LessonCalendar` move**: the returned-`error` path was already correct (block rolled back, banner
  with `role="alert"`, auto-clears after 5s). Broken part: a thrown exception left the block in the new
  slot with an unhandled rejection. Added try/catch that restores `previousLessons` and shows "Couldn't
  move the lesson. Try again."
- **`moveLessonAction` leak**: it returned `Unable to move lesson: <Supabase message>` to the UI. It now
  returns only the overlap message (new exported `LESSON_OVERLAP_MESSAGE` in `data.ts`, same text as
  before) or "Couldn't move the lesson. Try again."; the real error is not logged (no server-side
  logging pattern exists in the repo), so it is currently dropped.
- Not changed (out of scope): `createLessonAction`/`updateLessonAction` still return raw
  `error.message` into `LessonForm`; `updateLessonStatusAction`/`bulkUpdateLessonPayment` still throw
  messages containing Supabase text (now never shown); `ConfirmDeleteForm` etc. unchanged.
- Verification: `format:check`, `lint` (0 errors, same 1 pre-existing warning + 1 info), `typecheck`,
  `test` (46 passed), `build` (after deleting a stale `.next`; first run hit the known webpack cache
  failure) pass. No new unit test (no pure function added). In the in-app browser, on a temporary public
  fixture route (removed) with `window.fetch` forced to reject server-action requests: at 375x812 the
  status change reverted to "Scheduled" and showed the alert, the phone payment button showed its alert
  without leaving the page, bulk "Mark as paid" showed the alert and kept the selection (checkbox still
  checked), a real mouse drag in the calendar snapped the block back to 10:00 and showed the banner; at
  1280x800 the alerts render full width, no horizontal overflow. **Not verified:** any behavior against
  the hosted account; the success paths and the real `redirect()` from the payment wrapper (the fixture
  cannot sign in); a returned (non-thrown) error from the bulk or move action in the UI (covered by
  reading code only); real phone.

## Previous Milestone (TD-014)

- Milestone: **TD-014 — Mobile follow-ups (quick actions, no-drag reschedule, confirm sheet, PWA)**
- Status: Implemented; **not verified on a real phone or against the hosted account**
- Branch: `main` (uncommitted)
- Last updated: 2026-10-10

Presentation-only; no schema, data-layer or server-action change. Desktop (`lg`+) layout unchanged.

- **Lesson page quick actions** (`LessonStatusActions.tsx`, `lessons/[id]/page.tsx`): below `lg`, a
  2-column action row sits above the details/homework cards: Join meeting (only if `meeting_url`),
  Mark completed (hidden once completed), Mark paid / Mark unpaid, Move. Reuses
  `updateLessonStatusAction` and `setLessonPaymentAction` unchanged (both still `requireTutorId` +
  RLS). Quick "Mark paid" forwards the lesson's existing `payment_method` if set, otherwise sends none
  (the full Payment card still defaults to `invoice`); "Mark unpaid" clears the method, as before.
- **No-drag reschedule**: a "Move" button (details card header, and the quick row) opens the existing
  Edit `LessonForm` and scrolls/focuses its Date & time field (`focusDateTime` prop). The quick row
  reaches `LessonDetailsCard` through a window event (`MOVE_LESSON_EVENT`).
- **`window.confirm` replaced** in `LessonStatusActions` (cancel lesson) and `ConfirmSubmitForm` by new
  `src/components/ConfirmModal.tsx` (on `Modal`, bottom sheet on phones). Same wording; confirm button
  is `min-h-12`, stacked under "Go back" with a 16px gap. `ConfirmSubmitForm` submits via
  `requestSubmit()` on confirm. `features/students/components/ConfirmDeleteForm.tsx` still uses
  `window.confirm` (not in ticket scope).
- **PWA**: `src/app/manifest.ts` (`start_url` `/dashboard`, `standalone`, colors = light canvas
  `#ecede8`), `public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180) generated from
  `src/app/icon.png` composited on white, referenced in `metadata.icons`. No service worker, no new
  dependency, so it is "add to home screen" capable but has no offline support.
- **StudentForm / SettingsForm at 375px**: no change needed; fields already stack (`grid-cols-1
  sm:grid-cols-2`), no horizontal overflow, submit is 44px; the shell's bottom padding already clears
  the tab bar, so no sticky bar was added.
- **Week grid breakpoint**: at 800px the 7-column grid is ~100px per day and truncates every student
  name, so `LessonsCalendarView.tsx` now shows `WeekAgenda` below `lg` (was `md`).
- Verification: `format:check`, `lint` (0 errors, same 1 pre-existing warning), `typecheck`, `test`
  (46 passed), `build` pass. In-app browser at 375x812 with a temporary fixture page (removed): quick
  row layout, cancel sheet (buttons 48px high, 16px apart, Go back/X close it), `ConfirmSubmitForm`
  confirm submits the form once, manifest + icon links present in `<head>`, no horizontal overflow in
  either form, submit buttons 44px. 800px: week grid inspected with a fixture (names truncated).
  **Not verified:** any hosted/authenticated page; Move actually opening the form focused on the date
  (`getLessonEditDataAction` needs auth - it redirected to sign-in); Join/Mark paid/Mark completed
  against real data; real PWA install on iOS/Android; native `<select>` branch; `WeekAgenda` at
  800px after the breakpoint change (only the CSS class was changed).
- Minor, not fixed: `Modal` close button measures 40px high, not the 44px TD-013 recorded.

## Previous Milestone (TD-013)

- Milestone: **TD-013 — Mobile usability pass (phones, ≤ 639px; tablets up to `lg` partly)**
- Status: Implemented; **not verified on a real phone or against the hosted account**
- Branch: `main`
- Last updated: 2026-10-10

Presentation-only change; no schema, data-layer, or server-action change (one extra `endTime` field
is passed through the schedule page to the agenda list). Desktop (`lg`+) layout is intentionally
unchanged. What changed, and why:

- **Navigation** (`AppShell.tsx`, `PortalShell.tsx`): the hamburger that expanded a panel *in the page
  flow* was replaced by a sticky top bar plus a fixed bottom tab bar (safe-area aware). Tutor tabs:
  Today, Schedule, Students, Homework (unread badge) + **Menu**; Lessons, Subjects, Settings, the
  Tutor/Student preview switch and sign-out live in the Menu sheet. The student portal gets the same
  5-tab bottom bar. **Bug fixed:** the portal's student switcher was `hidden sm:block`, so a parent
  with several children could not switch child on a phone; it now shows in a bar under the header.
- **Dropdowns** (`Select.tsx`): on touch devices (`(pointer: coarse)`) the custom popover is replaced by
  the platform's native `<select>` (16px font, 44px high). The custom popover was clipped by the
  modal's scroll container, closed when the page was scrolled, and had ~32px rows. Desktop keeps the
  custom listbox. `DatePicker.tsx` popover is now clamped to the viewport width.
- **Bottom-sheet modal** (`Modal.tsx`): below `sm` the dialog docks to the bottom (full width, rounded
  top, `dvh` height, safe-area padding, grab handle, 44px close button) and slides up.
- **Inputs/buttons**: `inputClassName` is `text-base` below `sm` (iOS Safari zooms the page on focus
  for inputs under 16px) with 44px min height; `Button` and `ThemeToggle` have 44/40px touch targets.
- **Schedule** (`WeekAgenda.tsx`, new): the 7-column week grid (≈40px per day on a phone) is hidden
  below `md` and replaced by a day-by-day list; tapping a day opens the day grid. `LessonCalendar`
  no longer attempts long-press drag on touch (`touch-pan-y` makes the browser cancel the pointer on
  vertical movement, so it could only ever move a lesson sideways); a tap opens the lesson, whose Edit
  form changes the time. Mouse/pen drag is unchanged.
- **Lessons list** (`LessonsListView.tsx`): below `md` the 640px-wide table (horizontal scroll) becomes
  cards with 44px checkboxes, a sort selector (the table's clickable headers don't exist there), 2-column
  filters, and a bulk-action bar docked above the bottom nav.
- **Dashboard** (`TodayDashboard.tsx`): below `lg` the actionable cards (next lessons, students, needs
  review) come before the charts; full-width "New lesson" button; card hover-lift only for mouse.
- **Misc**: `viewport` export (`viewport-fit=cover`, theme-color; zoom left enabled), `min-h-dvh`
  instead of `min-h-screen`, student-detail tabs scroll horizontally instead of wrapping.
- Verification: `format:check`, `lint` (0 errors, same 1 pre-existing warning), `typecheck`, `test`
  (46 passed), `build` all pass. Visually checked at 375×812 in the in-app browser using a temporary
  fixture page (removed): bottom bar, Menu sheet, week agenda. **Not checked:** the native `<select>`
  branch (the in-app emulation does not reliably report `pointer: coarse`), iOS Safari, the dashboard
  reorder, the lessons card list, the portal shell — no interactive hosted session was available.

## Previous Milestone (TD-012)

- Milestone: **TD-012 — Total outstanding balance stat on the tutor dashboard**
- Status: Implemented; independent review recommended
- Branch: `main`
- Last updated: 2026-09-28

The tutor dashboard (`src/features/dashboard/`) previously showed only an "unbilled" *count* of
completed+unpaid lessons, with no currency amount anywhere on the dashboard despite its rich
time/workload analytics — a gap flagged in the original UX audit ("the dashboard analytics section
is rich for time tracking but has no money view at all"). This adds the summed outstanding balance
next to that existing count.

- **Data layer** (`getTodayDashboardData` in `src/features/dashboard/data.ts`): a new plain query
  (`.select("price, currency")` on `lesson`, same `status = 'completed' AND payment_status =
  'unpaid'` predicate as the existing unbilled-count/oldest-date queries, plus `.not("price", "is",
  null)`) is summed and grouped by currency in JS (`unbilledAmountByCurrency`, a `Map`), sorted
  descending by total. **Deliberately no new DB migration, RPC, or aggregate** — this ticket's
  explicit constraint, since this environment cannot apply schema changes to the live hosted
  Supabase project (see TD-011 below, still pending). A tutor's own unbilled lesson set is a small,
  bounded row count, so a plain `.select()` + JS `reduce`/grouping is fine, mirroring the reasoning
  TD-011's migration comment already gives for why a JS sum would have been safe there too. `unbilled`
  now returns `{ count, oldestDate, amounts: { currency, total }[] }` instead of just `{ count,
  oldestDate }`.
- **UI** (`TodayDashboard.tsx`): the existing "N unbilled lessons" link
  (`/dashboard/lessons?status=completed&payment=unpaid`) is left completely untouched — still the
  same pill, same link, same conditional (`unbilled.count > 0`). One additional pill per currency is
  rendered alongside it inside the same flex-wrap row, each using `formatMoney(total, currency,
  locale)` (`src/lib/formatting.ts`) with the page's existing `getTutorFormatSettings`-resolved
  locale — no new money-formatting logic, matching the pattern TD-011 already established on the
  billing page. Multiple currencies render as separate pills rather than being summed together,
  since summing across currencies would be meaningless.
- **Ownership**: reuses the exact same query/RLS pattern the existing unbilled-count query already
  relies on (no app-level `tutor_id` filter — `lesson`'s RLS `select` policy already scopes every
  query to `auth.uid()`, same as TD-006's unpaid-lessons filter and every other unfiltered dashboard
  query). Not weakened: same predicate, same implicit RLS scoping, no client-supplied filter of any
  kind.
- Scope was kept deliberately narrow per the ticket: no change to the billing page, payment actions,
  lesson creation, or any other feature — purely one new dashboard stat, additive to the existing
  unbilled-count UI.

## Previous Milestone (TD-011)

- Milestone: **TD-011 — Per-student running balance on the tutor billing page**
- Status: **Implemented; independent review recommended; new DB function unverified against the
  live hosted database**

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
to Manrope (`next/font/google`; **superseded** — the app now uses Space Grotesk + JetBrains Mono, see
`src/app/layout.tsx`, corrected in TD-021) for a distinctive but still calm, professional feel — no new npm
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
- `pnpm audit`: not re-run; no new dependencies were added (the font, then Manrope, now Space Grotesk
  + JetBrains Mono, loads via `next/font/google`, which ships with Next.js).

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
- **Migration applied (2026-09-29)**: `tutor_unpaid_summary` was pushed to the live hosted Supabase
  project (`cmlvtnjoynffrznyelym`) via `apply_migration`, with the user's explicit go-ahead. Security
  advisor re-checked after applying: the function is flagged `authenticated_security_definer_function_
  executable` (WARN) — expected and consistent with six other pre-existing `security definer` RPCs in
  this project (`accept_portal_invite`, `portal_count_lessons`, `portal_list_lessons`,
  `portal_list_students`, `portal_unpaid_summary`, `submit_homework`), all intentionally callable by
  `authenticated` with their own internal `auth.uid()` ownership check — same pattern, not a new class
  of issue. No other new advisor findings. The billing page's RPC call now works against production.
  Full manual browser walkthrough (seed a completed+unpaid lesson, confirm the card renders correctly,
  repeat with a second currency) still not performed in this session.

- TD-012 verification (2026-09-28): this worktree's branch was already on `main` (had TD-011), so
  no fast-forward was needed. Hit the same known CRLF-on-disk issue on the first `format:check`
  (139 errors, on files this task never touched); fixed the same documented way — committed this
  task's changes first as a safety checkpoint, `git rm -r --cached . && git reset --hard HEAD`, then
  fixed a `currency: string | null` typecheck error surfaced after that (the `lesson.currency`
  column is nullable; the currency-grouping loop now also skips rows with a null currency, matching
  the existing null-`price` skip) and squashed the checkpoint plus that fix into one clean commit
  (`git reset --soft`, local history on this not-yet-shared worktree branch). After that: `pnpm run
  format:check` — clean, 182 files. `pnpm run lint` — 0 errors (same 1 pre-existing unrelated
  warning + 1 info as TD-006–TD-011, both in files this task didn't touch). `pnpm run typecheck` —
  clean. `pnpm run test` — 10 files, 46 tests, all passed (no test logic changed; no new tests added
  — the new currency-grouping loop is a straightforward `Map`-based sum with no branching complex
  enough to warrant its own test, matching the no-new-tests precedent set for similarly-thin
  aggregation code in TD-009/TD-010/TD-011). `pnpm run build` — passed cleanly after deleting `.next`
  first, all 39 routes compiled (dashboard route: 5.19 kB), no cache corruption hit this run. `pnpm
  audit` not re-run — no new dependency was added.
- No manual/hosted-browser walkthrough of the new outstanding-balance pill(s) was performed (no
  interactive Supabase session in this unsupervised environment) — flagged as unverified pending a
  manual pass: specifically, seed a completed+unpaid lesson with a price, confirm the pill renders
  next to the existing "N unbilled lessons" link with the correct formatted amount, then seed a
  second unpaid lesson in a different currency and confirm two separate pills render (not a single
  incorrectly-summed total).

## Known Issues

- Supabase's advisor still reports leaked-password protection disabled for hosted Auth
  (pre-existing, unrelated to this task).
- `e2e/auth.spec.ts` is stale relative to the current `AuthForm` component (pre-existing).
- ~~The week calendar view is cramped on phones~~ — fixed in TD-013 (day-by-day list below `md`).
  TD-014 also moved the agenda/grid switch from `md` to `lg`.
- Calendar student colors (TD-016) are distinct for up to 8 students shown together and repeat beyond
  that; they are derived, not stored, so adding/archiving a student can shift another's color. A
  persisted per-student color would fix both but needs a schema change (not approved).
- Theme preference is per-browser (`localStorage`), not per-account — see Not Implemented.
- The dashboard's time-based greeting still evaluates in the server/browser's own time zone. The
  lesson calendar's "now" and today/past highlighting use the tutor timezone as of TD-016; other
  browser-clock uses are listed in TD-016's "Found, not fixed".
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
- ~~TD-009's "select all visible" only selects the current page~~ — TD-017 added "Select all N matching"
  (cap 2000, server-side re-selection). Not yet verified against the hosted database.
- Email (TD-020) is built but inactive: provider is Resend (ADR-015), the switch is off, the migration is
  unapplied and there is no cron entry. Until the owner activates it (docs/EMAIL_SETUP.md), the TD-010
  due-date nudges still only surface while the tutor or student is looking at the app. No push channel exists.
- A lesson with no student/guardian email when its reminder window opens is logged `skipped` and never
  retried; failed (non-429) sends are not retried either (at-most-once by design).
- TD-010's dashboard and portal due-date nudges were not manually verified against a live hosted
  account — see Verification State for the specific manual pass recommended before relying on this
  fully.
- TD-011's `tutor_unpaid_summary` migration is now applied to the live hosted Supabase project
  (2026-09-29) — see Verification State. Still no manual/hosted-browser walkthrough of the resulting
  billing-page card.
- TD-012's new outstanding-balance pill(s) were not manually verified against a live hosted account
  — see Verification State for the specific manual pass recommended before relying on this fully.

## Next Recommended Task

**Owner activation pass for TD-020 and TD-022** (owner-driven, in order): review and apply
`supabase/migrations/20261010000000_notification_log.sql` and `supabase/migrations/20261011000000_lesson_packages.sql`, rerun `pnpm run db:types` and reconcile
`database.types.ts`, finish the Resend/Supabase SMTP setup in `docs/EMAIL_SETUP.md`, set the env vars with the
switch still false, test sign-up and password-reset emails, then enable the switch, try the balance button on
a student whose guardian email is the owner's own, and only then add the `vercel.json` cron entry. Still
pending from before: the manual phone/hosted pass of TD-013 to TD-019, `pnpm run test:e2e` where Chromium
installs, the stale heading in `e2e/app.spec.ts`, and a deliberate `next` upgrade for the `pnpm audit`
advisories.

**Payment-tracking design note (2026-09-29, in response to an explicit owner question):** verified
there is no in-app payment processing anywhere in this codebase — no Stripe/PayPal/checkout
integration exists (`grep`-confirmed across `src/`). `payment_status`/`payment_method` on `lesson` are
purely tutor-side manual bookkeeping fields (the tutor marks a lesson paid and picks a label —
`online`/`invoice`/`sbp` — after money changes hands elsewhere); students never see or trigger a
payment action anywhere in the app. Every payment-related feature built in TD-006–TD-012 (the
unpaid filter, bulk mark-paid, per-student balance, dashboard revenue total) reads/writes `lesson`
scoped only by `tutor_id`, with zero dependency on the student having a portal account: `student` rows
require no `portal_membership`/`portal_invite` to exist (`hasPortalMembership`/`listPortalMembers` in
`src/features/students/data.ts` treat both as optional, separate concerns from the student record
itself). A student added purely for the tutor's own record-keeping, who never receives an invite and
never logs in, is tracked identically to one who does — the only features gated on a portal account
are the student-facing portal pages themselves (`NextLessonCard`, `HomeworkDueBanner`,
`portal_unpaid_summary`), which simply render nothing for a student without one; nothing on the tutor
side assumes or requires it.
