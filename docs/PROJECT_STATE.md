# TutorDesk Project State

## Current Milestone

- Milestone: **Lessons payment-status filter + dashboard "unbilled" deep link**
- Status: **Implemented; verified**
- Branch: `main`
- Last updated: 2026-09-28

This entry supersedes the milestone/status lines below (TD-005) as the current top-of-file state;
older milestone text further down is kept for history and was not re-verified in this task.

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
- **Status color mapping** now uses the brand hues meaningfully rather than generic
  red/yellow/green: lesson `scheduled`=cyan, `completed`=brand(green), `cancelled`=neutral,
  `no_show`=amber; homework `assigned`=neutral, `submitted`=cyan, `reviewed`=violet. The calendar's
  lesson blocks use the same mapping as solid fills.
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

- Correction (verified 2026-09-28): the "recurring lessons ... not implemented" claim previously
  here is stale/false. `src/features/lessons/data.ts` has `createLessonSeries`,
  `cancelLessonSeries`, `listActiveLessonSeriesForGeneration`, `insertGeneratedLessons`, and
  `updateSeriesGeneratedUntil`; `src/features/lessons/recurrence.ts` and the `lesson_series` table
  migration (`supabase/migrations/20260913170002_create_lesson_series.sql`) exist. Payment tracking
  is also implemented, not stub: `lesson.payment_status`/`payment_method`/`paid_at` columns,
  `updateLessonPayment`, and the payment filter added in this task all operate on real schema. This
  was verified by reading the code, not by re-running the recurring-lesson or payment feature's own
  tests in this task — invoicing and the student portal were not checked and their status is
  unverified.
- A dedicated mobile-optimized week calendar layout (unchanged from TD-004 — see Known Issues).
- Per-user theme preference stored server-side; theme choice is `localStorage`-only (per browser,
  not per account), which is consistent with this being a prototype and matches how most SaaS theme
  toggles work before a settings page exists.

## Verification State

- Payment-status filter (2026-09-28): added `payment=unpaid|paid|all` filter to
  `listLessonsPage` (`src/features/lessons/data.ts`), a `paymentFilterSchema` Zod enum
  (`src/features/lessons/schemas.ts`) validating the query param server-side in
  `src/app/dashboard/lessons/page.tsx`, and a matching `Select` in `LessonsListView.tsx`. The
  dashboard's "unbilled" link (`TodayDashboard.tsx`) now points to
  `/dashboard/lessons?status=completed&payment=unpaid`, matching the exact predicate the unbilled
  count itself uses (`status=completed AND payment_status=unpaid`, confirmed in
  `src/features/dashboard/data.ts`). No new tutor-ownership check was needed: `listLessonsPage`
  already relies on Postgres RLS (`lesson_tutor_id` policies in
  `supabase/migrations/20260913150813_create_lesson.sql`, `using ((select auth.uid()) = tutor_id)`)
  for every existing filter (status/student/subject), and the new payment filter follows the same
  pattern — it never receives or trusts a tutor/owner ID from the client, so it cannot cause an
  IDOR: a tutor can only ever see their own rows regardless of which payment value is requested.
  Ran `pnpm run lint`, `pnpm run typecheck`, `pnpm run test` (41 tests, 9 files, all passed), and
  `pnpm run build` (all routes compiled, no errors) — all passed with no findings in the changed
  files. `pnpm run format:check` (part of `pnpm run verify`) fails, but on ~178 pre-existing
  diagnostics across files this task did not touch (e.g. `tsconfig.json`, `vitest.config.ts`, an
  unrelated test file) — confirmed pre-existing by stashing this task's changes and re-running
  Biome format against the unmodified baseline, which fails identically. Root cause is
  `core.autocrlf=true` producing CRLF line endings repo-wide on this Windows checkout, which Biome's
  formatter (LF) rejects; this is an environment/checkout issue unrelated to this ticket's diff, so
  it was not fixed here (out of scope).

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

## Known Issues

- Supabase's advisor still reports leaked-password protection disabled for hosted Auth
  (pre-existing, unrelated to this task).
- `e2e/auth.spec.ts` is stale relative to the current `AuthForm` component (pre-existing).
- The week calendar view is visually cramped on narrow (≤375px) mobile viewports (pre-existing,
  noted in TD-004; unchanged by this task's recoloring).
- Theme preference is per-browser (`localStorage`), not per-account — see Not Implemented.
- The dashboard's time-based greeting and the lesson calendar's "now" indicator both evaluate in the
  server/browser's own time zone rather than an explicit tutor timezone setting (pre-existing,
  documented simplification, not a regression here).

## Next Recommended Task

**Fix the pre-existing repo-wide CRLF/Biome format mismatch** (`core.autocrlf=true` on this Windows
checkout produces CRLF line endings that Biome's formatter, configured for LF, rejects on ~178
files including files this and prior tasks never touched). Either normalize line endings via
`.gitattributes` (`* text=auto eol=lf`) plus a one-time repo-wide reformat, or adjust Biome's
`lineEnding` setting to match the checkout — so `pnpm run verify` (and CI, if it runs on Windows
runners) can pass cleanly instead of every task needing to carve this failure out as "pre-existing."
