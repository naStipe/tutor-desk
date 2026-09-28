# TutorDesk Project State

## Current Milestone

- Milestone: **Student unarchive/reactivate action**
- Status: **Implemented; independent review recommended**
- Branch: `main`
- Last updated: 2026-09-28

## Current Reality

A tutor can now reactivate an archived student from `/dashboard/students/archived`. This closes a
prior gap: only `archiveStudentAction` existed, with no way back short of re-creating the student
(which would have lost lesson/homework history). `unarchiveStudent` (`src/features/students/data.ts`)
clears `archived_at` on the `student` row; `unarchiveStudentAction`
(`src/features/students/actions.ts`) validates the session via `requireTutorId()`, calls it, and
revalidates the active students list, the archived list, the student's own detail path, and the
dashboard, then redirects back to the archived list. It intentionally does not touch any `lesson`
rows — lessons cancelled by the earlier archive stay cancelled; restoring lesson history is explicit
out-of-scope per the ticket. The archived list page (`src/app/dashboard/students/archived/page.tsx`)
gained a "Reactivate" button next to the existing "Delete permanently" button, built with the same
`ConfirmSubmitForm` (browser `confirm()` dialog, secondary button variant) already used for
`archiveStudentAction` on the student detail page — no new confirmation/loading pattern was
introduced.

Note: this session found `docs/PROJECT_STATE.md`'s prior "6 unit test files, 21 tests" and "16/16
routes" claims already stale relative to the actual repo (now 9 test files / 41 tests, 38 build
routes) — likely from feature work landed after the TD-005 doc entry was last updated. Corrected
below; this task did not investigate what changed those numbers, only re-measured them.

## Prior Reality (TD-005, visual overhaul)

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

- Reactivating an archived student does not restore the lessons that were auto-cancelled when they
  were archived. This is intentional (out of scope, ambiguous which cancelled lessons a tutor would
  want back) — if a tutor needs those lessons back, they must be re-created manually. There is also
  still no unarchive control on the student detail page itself (`src/app/dashboard/students/[id]/page.tsx`);
  only the archived list page has the new "Reactivate" button, per this task's scope.
- The design-lab previews are intentionally not connected to Supabase, live tutor data, or product
  actions, and are not linked from the production navigation. They are visual proposals only.

- Everything listed as not implemented in TD-004 remains not implemented (recurring lessons,
  invoices, student portal, etc.) — this task was visual/theming only, no feature scope changed.
- A dedicated mobile-optimized week calendar layout (unchanged from TD-004 — see Known Issues).
- Per-user theme preference stored server-side; theme choice is `localStorage`-only (per browser,
  not per account), which is consistent with this being a prototype and matches how most SaaS theme
  toggles work before a settings page exists.

## Verification State

- Unarchive-action verification (2026-09-28): `npx tsc --noEmit` (repo-wide typecheck) passed clean.
  `npx vitest run` passed (9 test files, 41 tests — no test logic changed by this task; these are the
  current real counts, correcting the stale "6 files, 21 tests" this doc previously claimed). `npx
  next build` passed cleanly (38 routes generated, no errors; run with the dev server stopped). `npx
  biome lint .` passed with zero errors (one pre-existing warning and one pre-existing info-level
  finding, both in unrelated files — `src/app/portal/homework/page.tsx` and
  `src/features/homework/components/HomeworkListView.tsx` — untouched by this task); `npx biome lint`
  scoped to the three changed files reported zero issues. `pnpm run format:check` / `biome format .`
  could **not** be used to verify formatting: it reports ~178 pre-existing CRLF-vs-LF diffs across
  essentially the whole repository (including files this task did not touch, e.g. `tsconfig.json`,
  `vitest.config.ts`), which looks like a Windows checkout line-ending mismatch against Biome's LF
  expectation rather than anything introduced here — unresolved and out of this task's scope to fix
  repo-wide. `pnpm audit` / dependency review: not re-run; no dependency was added or changed.
  Playwright E2E: not run (same pre-existing gap noted below — no Chromium binary in this
  environment); the changed pages have no existing E2E coverage to update.
- Manual verification of this task was reasoning-based, not browser-driven (no `.env`/hosted Supabase
  credentials available in this environment to exercise the real archive/unarchive flow live): traced
  `unarchiveStudentAction` — `requireTutorId()` redirects to `/sign-in` when unauthenticated;
  `unarchiveStudent` issues `update({ archived_at: null }).eq("id", id)` with no `tutor_id` filter,
  matching the existing `archiveStudent`/`deleteStudent`/`updateStudent` pattern, which is safe here
  because `docs/SECURITY.md` documents that `public.student`'s RLS `UPDATE` policy independently
  requires `tutor_id = auth.uid()` — so a foreign student ID resolves to zero rows updated (a
  same-shape no-op as the existing actions), never another tutor's row. `revalidateTag`/`revalidatePath`
  calls mirror `archiveStudentAction`'s targets (active list, archived list, dashboard) plus the
  student's own detail path so a reactivated student's page stops showing archived state. Did not
  independently query the hosted `student` table or run `supabase/tests/student_rls.sql` to confirm
  the RLS policy text still matches the doc's description — flagged as unverified below.

- Design-lab verification (2026-09-16): scoped Biome format/lint, full TypeScript typecheck, and the
  optimized Next.js production build passed. Both mockups compiled as static routes and were
  manually inspected in the in-app browser at a narrow responsive viewport. No behavior tests were
  added because the concepts contain no product functionality.
- `pnpm run build`: passed cleanly at the time — 16/16 routes, no errors — run with the dev server
  stopped (route count has since grown; see this task's entry above for the current count).
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

- `biome format .` / `pnpm run format:check` reports ~178 pre-existing CRLF line-ending diffs across
  most of the repository in this Windows checkout, unrelated to this task's code changes and not
  fixed here (fixing it repo-wide is out of this task's scope).
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

**Recurring lesson series (`LessonSeries`): a rule (e.g. "every Tuesday at 17:00 for 60 minutes")
that generates concrete `lesson` rows, with the ability to edit or cancel a single occurrence versus
the whole series, reusing the calendar UI and ownership/RLS patterns established in TD-003/TD-004.**
