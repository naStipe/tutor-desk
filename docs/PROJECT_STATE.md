# TutorDesk Project State

## Current Milestone

- Milestone: **TD-008 — Calendar color-coding by student**
- Status: **Implemented; independent review recommended**
- Branch: `main`
- Last updated: 2026-09-28

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

## Next Recommended Task

**Bulk "mark lessons as paid" on the lessons list (`src/app/dashboard/lessons`,
`src/features/lessons/`): row checkboxes plus a bulk action that flips `payment_status` to `paid`
for the selected completed lessons, reusing the `payment=unpaid|paid|all` filter TD-006 already
added (`paymentFilterSchema`, `listLessonsPage`) so a tutor can filter to `payment=unpaid`, select
several, and clear them in one action instead of opening each lesson individually. Picked over the
homework due-date dashboard nudge because it's a smaller, more contained change (one list view, one
new server action, no new dashboard surface) and directly extends a filter that already exists and
is already unverified against a live account (TD-006) — a good opportunity to verify both at once.
Needs the usual IDOR check: the bulk update must still scope to `tutor_id = auth.uid()` (RLS already
does this for `lesson`, but double-check the bulk-update query shape doesn't bypass or weaken it).**
