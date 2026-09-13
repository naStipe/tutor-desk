# TutorDesk Project State

## Current Milestone

- Milestone: **TD-003 — Lessons (single lessons, day/week calendar, status lifecycle)**
- Status: **Implemented; independent review recommended**
- Branch: `main`
- Last updated: 2026-09-13

## Current Reality

TutorDesk is a Next.js App Router modular monolith using hosted Supabase Auth and PostgreSQL. Tutors
sign in, land in a real application shell, manage a student roster (TD-002), and now schedule single
lessons tied to a student, view them in a day/week calendar, and move each lesson through a
scheduled/completed/cancelled/no_show status lifecycle.

The repository is linked to hosted project `cmlvtnjoynffrznyelym` (Supabase name: TutorHub).

## Database and authorization

- `public.tutor_profile` (TD-001S) and `public.student` (TD-002) are unchanged.
- TD-003 adds `public.lesson`: `id` (uuid, default `gen_random_uuid()`), `tutor_id` (references
  `public.tutor_profile(user_id)`, `ON DELETE CASCADE`), `student_id` (references
  `public.student(id)`, `ON DELETE CASCADE`), `start_time`/`end_time` (timestamptz, check constraint
  `end_time > start_time`), `status` (text, check-constrained to `scheduled`/`completed`/`cancelled`/
  `no_show`, defaults to `scheduled`), `notes`, `created_at`, `updated_at`. Migration:
  `supabase/migrations/20260913150813_create_lesson.sql`, applied via `supabase db push`.
- RLS is enabled. Select/insert/update policies compare `(select auth.uid())` to `tutor_id`. The
  insert and update policies additionally require (via a correlated subquery against
  `public.student`) that `student_id` belongs to a student owned by that same tutor — this closes an
  IDOR-adjacent gap where `tutor_id` ownership alone would let a tutor link a lesson to another
  tutor's student record. There is no ordinary delete policy; `cancelled`/`no_show` serve the
  lifecycle role `archived_at` serves for students.
- Generated hosted types are committed at `src/lib/supabase/database.types.ts`; `db:types:check`
  passes.
- Hosted RLS/ownership behavior (own-row create/status-update, end<start rejection, cross-tenant
  student-linking rejection, cross-tenant read/insert/update denial) is verified by
  `supabase/tests/lesson_rls.sql`, run via `pnpm run db:test:hosted:lessons`.

## Authentication

Unchanged from TD-001S/Google OAuth/TD-002.

## UI

- Nav: "Lessons" is now a real sidebar/mobile-nav link (promoted out of "coming later"); Calendar,
  Homework, and Invoices remain disabled placeholders.
- `/dashboard`: "Active students" and a real "Upcoming lessons" count (scheduled lessons with
  `start_time` in the future) replace the earlier static placeholder card. Quick actions offer both
  "Add student" and "Schedule lesson".
- `/dashboard/lessons`: day/week agenda calendar (`?view=day|week&date=YYYY-MM-DD`), grouped by day,
  with Prev/Today/Next navigation and a Day/Week toggle. Each entry shows time range, student name,
  and a status badge, and links to the lesson detail page.
- `/dashboard/lessons/new`: create form (student select from active students, start/end
  `datetime-local` inputs, optional notes) via `createLessonAction`. If the tutor has no active
  students, shows a guiding empty state instead of a broken form.
- `/dashboard/lessons/[id]`: detail page with an inline edit form (`updateLessonAction`) and status
  buttons for every status other than the current one (`setLessonStatusAction`). An invalid or
  non-owned ID renders `notFound()` (RLS returns no row for a non-owned lesson, so cross-tenant access
  fails closed as a 404). If the assigned student was since archived, the edit form still includes
  them in the select so editing doesn't silently drop the association.
- `src/features/lessons/components/{LessonForm,StatusBadge}.tsx` and
  `src/features/lessons/date-utils.ts` (day/week range math, `datetime-local` ⇄ ISO conversion, and
  all human-readable date/time formatting) are shared across the three lesson pages.
- Verified manually in-browser: create student → schedule lesson → lesson appears in the correct week
  and day view → open lesson → mark completed → dashboard's upcoming-lessons count updates
  accordingly.

## Not Implemented

- Recurring lesson series, lesson pricing/subject fields, homework, invoices, student portal,
  invitations, payments.
- Student phone/parent contact fields, default rate, tags, avatar, billing info, custom fields.
- Archived-student management UI, search/pagination infrastructure, password reset, account
  settings, MFA UI, organizations, multiple tutors.
- A tutor-level timezone setting. `datetime-local` inputs are interpreted in the *browser's* local
  time zone when converted to ISO for storage (client-side conversion, not server-side), which is
  correct for a single-timezone tutor using their own browser, but there is no explicit tutor
  timezone field yet — see Known Issues for the one remaining server-locale-dependent spot.

## Verification State

- `pnpm run format:check`, `lint`, `typecheck`, `test`: passed (5 unit test files, 15 tests,
  including new `src/test/lesson-schemas.test.ts`).
- `pnpm run build`: Next.js compiled successfully, type-checked, and generated all static/dynamic
  routes (8/8), including the three new lesson routes. The `output: "standalone"` file-tracing step
  then failed with `EPERM` while creating symlinks under `.next/standalone/node_modules` — the same
  pre-existing Windows-local-filesystem permission limitation noted in TD-002, unrelated to this
  change (not reproducible on Linux/CI).
- Hosted migration: dry-run reviewed, then applied with `supabase db push --linked`; `list_tables`
  confirms `public.lesson` with RLS enabled and the expected FK/check constraints.
- Hosted RLS/ownership SQL test (`supabase/tests/lesson_rls.sql`, transaction-rolled-back): passed —
  own-tutor create/status-update succeeded; an `end_time <= start_time` insert was rejected by the
  check constraint; a lesson referencing another tutor's student was rejected by the insert policy
  even with a matching `tutor_id`; cross-tenant read, insert, and update were denied.
- Generated-type drift check (`pnpm run db:types:check`): passed.
- Manual browser walkthrough against the hosted dev project (real signed-in account): add student →
  schedule lesson → lesson appears in the week view for the correct week and in the day view for its
  date → open lesson detail → mark completed → status badge and action buttons update → dashboard
  "Upcoming lessons" count drops to 0 (completed lessons are excluded from the upcoming count). All
  passed.
- During this walkthrough, a genuine bug was found and fixed: `date.toLocaleDateString(undefined, {
  day: "numeric", year: "numeric" })` (no `month`) rendered malformed output ("2026 (day: 13)") in
  this server's Node/ICU build for *any* locale, not just non-English ones. Fixed by never using that
  specific option combination and by pinning explicit locales (`"en-US"`) for all date/time formatting
  in `src/features/lessons/date-utils.ts` and the student detail page's `formatDate`, so display text
  no longer depends on the server process's OS locale (observed as `en-FI` in this environment).
- Playwright E2E: not run (same pre-existing gap as TD-002 — no Chromium binary installed;
  `e2e/auth.spec.ts` remains stale and unrelated to this task).
- `pnpm audit`: not re-run; no new dependencies were added in this task.

## Known Issues

- Supabase's advisor still reports leaked-password protection disabled for hosted Auth (pre-existing,
  unrelated to TD-003).
- `e2e/auth.spec.ts` is stale relative to the current `AuthForm` component (pre-existing, noted in
  TD-002's state).
- `pnpm run build`'s standalone output step cannot complete on this Windows machine due to symlink
  permissions (pre-existing, noted in TD-002's state); verify on Linux/CI or with Windows Developer
  Mode enabled before relying on the standalone build output locally.
- The dashboard's time-based greeting (`new Date().getHours()`, from TD-002) still evaluates in the
  server process's time zone rather than the tutor's; this is a known, documented simplification, not
  a regression from this task.

## Next Recommended Task

**Homework: a minimal text-only `homework` domain (assignment tied to a student and optionally a
lesson, due date, student text submission, tutor feedback) so the student portal groundwork can begin
and the app shell's remaining "coming later" homework placeholder can become real, following the same
ownership/RLS and app-shell patterns established in TD-002/TD-003.**
